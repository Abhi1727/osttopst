using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using PstConverter.Data;
using PstConverter.Models;
using Microsoft.EntityFrameworkCore;

namespace PstConverter.Services;

/// <summary>
/// Background service that periodically cleans up old files and expired conversion sessions.
/// </summary>
public class CleanupBackgroundService(
    IServiceProvider serviceProvider, 
    ILogger<CleanupBackgroundService> logger,
    IFileCleanupQueue cleanupQueue) : BackgroundService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly ILogger<CleanupBackgroundService> _logger = logger;
    private readonly IFileCleanupQueue _cleanupQueue = cleanupQueue;
    private readonly string _uploadDir = StorageConstants.UploadDir;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1);
    private readonly TimeSpan _initialDelay = TimeSpan.FromMinutes(30);  // wait before first cleanup
    private readonly TimeSpan _maxFileAge = TimeSpan.FromHours(6);      // sessions live for 6h

    /// <summary>
    /// Core execution loop of the background service.
    /// </summary>
    /// <param name="stoppingToken">A token that triggers when the service is shutting down.</param>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Cleanup Background Service is starting.");

        // Process the cleanup queue continuously in the background from startup
        _ = Task.Run(async () =>
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try { await ProcessCleanupQueueAsync(); } catch { }
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }, stoppingToken);

        // Wait before first scheduled cleanup run
        try
        {
            await Task.Delay(_initialDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Cleanup cancelled before first run.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoCleanupAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurring during cleanup");
            }

            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Cleanup Background Service is stopping.");
    }

    /// <summary>
    /// Orchestrates the cleanup process for physical files and database records.
    /// </summary>
    /// <param name="stoppingToken">Cancellation token.</param>
    private async Task DoCleanupAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Performing cleanup of old files...");

        if (Directory.Exists(_uploadDir))
        {
            var now = DateTime.Now;
            var directoryInfo = new DirectoryInfo(_uploadDir);

            // Clean up loose files (fallback for non-session files or if DB sync fails)
            // Synchronize with _maxFileAge for aggressive testing if requested
            var orphanFileTimeout = _maxFileAge;
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug("Scanning directory {Dir} for orphan files older than {Timeout}", _uploadDir, orphanFileTimeout);
            }
            foreach (var file in directoryInfo.GetFiles())
            {
                // Skip .ost files — they are long-lived source files deleted only when their session expires.
                // They are protected for up to 6 hours from their LastAccessedAt in the DB.
                if (file.Extension.Equals(".ost", StringComparison.OrdinalIgnoreCase))
                    continue;

                if (now - file.LastWriteTime > orphanFileTimeout)
                {
                    try
                    {
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation("Deleting old file: {FileName}", file.Name);
                        }
                        await TryDeleteWithRetryAsync(file.FullName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete file: {FileName}", file.Name);
                    }
                }
            }

            // Clean up chunk directories
            foreach (var dir in directoryInfo.GetDirectories("chunks_*"))
            {
                if (now - dir.LastWriteTime > _maxFileAge)
                {
                    try
                    {
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation("Deleting old chunk directory: {DirName}", dir.Name);
                        }
                        dir.Delete(true);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete directory: {DirName}", dir.Name);
                    }
                }
            }
        }

        // Optional: Clean up old sessions from database
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pool = scope.ServiceProvider.GetRequiredService<IPstStoragePool>();

        var cutoff = DateTime.Now - _maxFileAge;
        var oldSessions = await db.ConversionSessions
            .Where(s => s.LastAccessedAt < cutoff)
            .ToListAsync(stoppingToken);

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug("Found {Count} sessions in database. Checking for expirations older than {Cutoff}",
                await db.ConversionSessions.CountAsync(stoppingToken), cutoff);
        }

        if (oldSessions.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Cleaning up {Count} expired sessions (inactive > {MaxAge})", oldSessions.Count, _maxFileAge);
            }
            foreach (var session in oldSessions)
            {
                await pool.RemoveAsync(session.SessionId);

                // Delete all files associated with this session (Pattern: {sessionId}_*)
                // This covers source OST/PST, converted PSTs, and ZIP exports.
                foreach (var sessionFile in Directory.GetFiles(_uploadDir, $"{session.SessionId}_*"))
                {
                    await TryDeleteWithRetryAsync(sessionFile);
                }

                // Split PST temp directory (if any)
                var splitDir = Path.Combine(_uploadDir, $"split_{session.SessionId}");
                if (Directory.Exists(splitDir))
                    try { Directory.Delete(splitDir, true); } catch { }
            }
            db.ConversionSessions.RemoveRange(oldSessions);
            await db.SaveChangesAsync(stoppingToken);
        }

        // Clean up orphaned database records (sessions with missing files on disk)
        var allSessions = await db.ConversionSessions.ToListAsync(stoppingToken);
        var orphanedSessions = new List<ConversionSession>();

        foreach (var session in allSessions)
        {
            var pstExists = File.Exists(Path.Combine(_uploadDir, $"{session.SessionId}.pst"));
            var ostExists = File.Exists(Path.Combine(_uploadDir, $"{session.SessionId}.ost"));
            var isReady = (session.Status ?? "").StartsWith("Ready", StringComparison.OrdinalIgnoreCase);

            // If no files exist and not in Ready state, mark for removal
            if (!pstExists && !ostExists && !isReady)
            {
                orphanedSessions.Add(session);
            }
        }

        if (orphanedSessions.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Removing {Count} orphaned sessions (files missing, not in Ready state)", orphanedSessions.Count);
            }
            foreach (var session in orphanedSessions)
            {
                try
                {
                    await pool.RemoveAsync(session.SessionId);
                }
                catch { }
            }
            db.ConversionSessions.RemoveRange(orphanedSessions);
            await db.SaveChangesAsync(stoppingToken);
        }
    }
    
    private async Task ProcessCleanupQueueAsync()
    {
        var count = _cleanupQueue.PendingFiles.Count;
        for (int i = 0; i < count; i++)
        {
            if (_cleanupQueue.PendingFiles.TryDequeue(out var item))
            {
                if (DateTime.Now >= item.DeleteAfter)
                {
                    await TryDeleteWithRetryAsync(item.Path);
                }
                else
                {
                    // Not ready yet, put it back
                    _cleanupQueue.PendingFiles.Enqueue(item);
                }
            }
        }
    }

    /// <summary>
    /// Attempts to delete a file with multiple retry attempts if the file is locked by another process.
    /// </summary>
    /// <param name="filePath">Target file path.</param>
    /// <param name="retries">Maximum number of retry attempts.</param>
    private async Task TryDeleteWithRetryAsync(string filePath, int retries = 3)
    {
        if (!File.Exists(filePath)) return;

        for (int i = 0; i < retries; i++)
        {
            try
            {
                File.Delete(filePath);
                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation("Successfully deleted: {File}", Path.GetFileName(filePath));
                }
                return;
            }
            catch (IOException ex)
            {
                if (i == retries - 1)
                {
                    _logger.LogWarning("Failed to delete {File} after {Retries} attempts. File might be locked. Error: {Msg}",
                        Path.GetFileName(filePath), retries, ex.Message);
                }
                else
                {
                    if (_logger.IsEnabled(LogLevel.Debug))
                    {
                        _logger.LogDebug("File locked, retrying deletion for {File} (attempt {Attempt})", Path.GetFileName(filePath), i + 2);
                    }
                    await Task.Delay(1000); // Wait 1s for handle to clear
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Unexpected error deleting {File}: {Msg}", Path.GetFileName(filePath), ex.Message);
                return;
            }
        }
    }
}
