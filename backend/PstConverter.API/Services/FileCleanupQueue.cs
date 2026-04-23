using System.Collections.Concurrent;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PstConverter.Services;

/// <summary>
/// Singleton service that manages a queue of temporary files scheduled for deletion.
/// </summary>
public interface IFileCleanupQueue
{
    void Schedule(string filePath, TimeSpan delay);
    ConcurrentQueue<(string Path, DateTime DeleteAfter)> PendingFiles { get; }
}

public class FileCleanupQueue : IFileCleanupQueue
{
    public ConcurrentQueue<(string Path, DateTime DeleteAfter)> PendingFiles { get; } = new();

    public void Schedule(string filePath, TimeSpan delay)
    {
        if (string.IsNullOrEmpty(filePath)) return;
        PendingFiles.Enqueue((filePath, DateTime.Now.Add(delay)));
    }
}
