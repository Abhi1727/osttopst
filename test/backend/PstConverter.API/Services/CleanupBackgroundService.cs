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

public class CleanupBackgroundService(IServiceProvider serviceProvider, ILogger<CleanupBackgroundService> logger) : BackgroundService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly ILogger<CleanupBackgroundService> _logger = logger;
    private readonly string _uploadDir = StorageConstants.UploadDir;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1);
    private readonly TimeSpan _maxFileAge = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Cleanup Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoCleanupAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurring during cleanup");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("Cleanup Background Service is stopping.");
    }

    private async Task DoCleanupAsync()
    {
        _logger.LogInformation("Performing cleanup of old files...");

        if (Directory.Exists(_uploadDir))
        {
            var now = DateTime.UtcNow;
            var directoryInfo = new DirectoryInfo(_uploadDir);

            // Clean up files
            foreach (var file in directoryInfo.GetFiles())
            {
                if (now - file.LastWriteTimeUtc > _maxFileAge)
                {
                    try
                    {
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation("Deleting old file: {FileName}", file.Name);
                        }
                        file.Delete();
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
                if (now - dir.LastWriteTimeUtc > _maxFileAge)
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

        var oldSessions = await db.ConversionSessions
            .Where(s => s.CreatedAt < DateTime.UtcNow.AddDays(-1))
            .ToListAsync();

        if (oldSessions.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Cleaning up {Count} old sessions from database", oldSessions.Count);
            }
            foreach (var session in oldSessions)
            {
                pool.Remove(session.SessionId);
            }
            db.ConversionSessions.RemoveRange(oldSessions);
            await db.SaveChangesAsync();
        }
    }
}
