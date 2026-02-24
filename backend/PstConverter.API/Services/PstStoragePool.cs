using System.Collections.Concurrent;
using Aspose.Email.Storage.Pst;
using Microsoft.Extensions.Caching.Memory;

namespace PstConverter.Services;

public interface IPstStoragePool : IDisposable
{
    Task<T> AccessAsync<T>(string sessionId, string filePath, Func<PersonalStorage, Task<T>> action, string? password = null);
    void Remove(string sessionId);
    Task RemoveAsync(string sessionId);
}

public class PstStoragePool : IPstStoragePool
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<PstStoragePool> _logger;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly MemoryCacheEntryOptions _cacheOptions;

    public PstStoragePool(IMemoryCache cache, ILogger<PstStoragePool> logger)
    {
        _cache = cache;
        _logger = logger;
        _cacheOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(30))  // was 1 min — too aggressive
            .RegisterPostEvictionCallback(EvictionCallback);
    }

    private const int MAX_OPEN_PSTS = 100;
    private readonly ConcurrentQueue<string> _openSessions = new();

    public async Task<T> AccessAsync<T>(string sessionId, string filePath, Func<PersonalStorage, Task<T>> action, string? password = null)
    {
        // Get-or-create the semaphore. We NEVER dispose this inside EvictionCallback
        // to avoid the race: Thread A holds a reference to the semaphore, Thread B (eviction)
        // disposes it, then Thread A's WaitAsync() throws ObjectDisposedException.
        var semaphore = _locks.GetOrAdd(sessionId, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();

        try
        {
            if (!_cache.TryGetValue(sessionId, out PersonalStorage? pst) || pst == null)
            {
                while (_openSessions.Count >= MAX_OPEN_PSTS)
                {
                    if (_openSessions.TryDequeue(out var oldSessionId))
                    {
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation("Max open PSTs reached. Evicting session {SessionId}", oldSessionId);
                        }
                        _cache.Remove(oldSessionId);
                    }
                }

                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation("Loading PST for session {SessionId} from {FilePath}", sessionId, filePath);
                }
                pst = PersonalStorage.FromFile(filePath);
                if (!string.IsNullOrEmpty(password))
                {
                    if (!pst.Store.IsPasswordValid(password))
                    {
                        pst.Dispose();
                        throw new UnauthorizedAccessException("Invalid password for PST file.");
                    }
                }

                _cache.Set(sessionId, pst, _cacheOptions);
                _openSessions.Enqueue(sessionId);
            }
            return await action(pst!);
        }
        finally
        {
            semaphore.Release();
        }
    }

    public void Remove(string sessionId)
    {
        _cache.Remove(sessionId);
    }

    public async Task RemoveAsync(string sessionId)
    {
        if (_locks.TryGetValue(sessionId, out var semaphore))
        {
            await semaphore.WaitAsync();
            try
            {
                _cache.Remove(sessionId);
                // After cache removal, the PST should be disposed by EvictionCallback.
                // We are holding the lock, so no new AccessAsync can start for this ID.
            }
            finally
            {
                semaphore.Release();
            }
        }
        else
        {
            _cache.Remove(sessionId);
        }
    }

    private void EvictionCallback(object key, object? value, EvictionReason reason, object? state)
    {
        if (value is PersonalStorage pst)
        {
            var sessionId = key.ToString();
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Evicting PST for session {SessionId}. Reason: {Reason}", sessionId, reason);
            }
            // Only dispose the PST file handle — NOT the semaphore.
            // The semaphore may still be referenced by other threads blocked in WaitAsync().
            // Disposing it here would cause ObjectDisposedException on those threads.
            // Semaphores are only cleaned up in Dispose() when the whole pool shuts down.
            try { pst.Dispose(); } catch { }
        }
    }

    public void Dispose()
    {
        foreach (var semaphore in _locks.Values) semaphore.Dispose();
        _locks.Clear();
        GC.SuppressFinalize(this);
    }
}
