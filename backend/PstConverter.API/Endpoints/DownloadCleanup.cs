using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PstConverter.Services;

namespace PstConverter.Endpoints;

/// <summary>
/// Helper to schedule temporary file deletion using the managed FileCleanupQueue.
/// </summary>
public class DownloadCleanup(IFileCleanupQueue queue)
{
    private readonly IFileCleanupQueue _queue = queue;

    /// <summary>
    /// Schedules a physical file for deletion after a default 30-second delay.
    /// </summary>
    public void ScheduleDelete(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return;
        _queue.Schedule(filePath, TimeSpan.FromSeconds(30));
    }
}
