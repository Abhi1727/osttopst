using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;

namespace PstConverter.Services;

    /// <summary>
    /// Background service that periodically cleans up old files and expired conversion sessions.
    /// </summary>
    public class CleanupBackgroundService(IServiceProvider serviceProvider, ILogger<CleanupBackgroundService> logger) : BackgroundService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly ILogger<CleanupBackgroundService> _logger = logger;
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

        // Wait before first run so recently-uploaded sessions aren't immediately evicted
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
                // Normal shutdown
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
            var now = DateTime.UtcNow;
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

        var cutoff = DateTime.UtcNow - _maxFileAge;
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

                // Also explicitly delete files if they match session ID (redundant but safe)
                // The directory cleanup above handles files by LastWriteTime, which might be different from LastAccessedAt in DB.
                // It's safer to rely on DB for session validity.

                var pstPath = Path.Combine(_uploadDir, $"{session.SessionId}.pst");
                var ostPath = Path.Combine(_uploadDir, $"{session.SessionId}.ost");

                // Converted files
                var convertedPst = Path.Combine(_uploadDir, $"{session.SessionId}_converted.pst");
                var convertedOst = Path.Combine(_uploadDir, $"{session.SessionId}_converted.ost");

                await TryDeleteWithRetryAsync(pstPath);
                await TryDeleteWithRetryAsync(ostPath);
                await TryDeleteWithRetryAsync(convertedPst);
                await TryDeleteWithRetryAsync(convertedOst);
            }
            db.ConversionSessions.RemoveRange(oldSessions);
            await db.SaveChangesAsync(stoppingToken);
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
