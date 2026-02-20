using System.Collections.Concurrent;
using Aspose.Email.Storage.Pst;
using Microsoft.Extensions.Caching.Memory;

namespace PstConverter.Services;

public interface IPstStoragePool : IDisposable
{
    Task<T> AccessAsync<T>(string sessionId, string filePath, Func<PersonalStorage, Task<T>> action, string? password = null);
    void Remove(string sessionId);
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
            .SetSlidingExpiration(TimeSpan.FromMinutes(1))
            .RegisterPostEvictionCallback(EvictionCallback);
    }

    private const int MAX_OPEN_PSTS = 100;
    private readonly ConcurrentQueue<string> _openSessions = new();

    public async Task<T> AccessAsync<T>(string sessionId, string filePath, Func<PersonalStorage, Task<T>> action, string? password = null)
    {
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

    private void EvictionCallback(object key, object? value, EvictionReason reason, object? state)
    {
        if (value is PersonalStorage pst)
        {
            var sessionId = key.ToString();
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Evicting PST for session {SessionId}. Reason: {Reason}", sessionId, reason);
            }
            try { pst.Dispose(); } catch { }

            if (sessionId != null)
            {
                if (_locks.TryRemove(sessionId, out var semaphore))
                {
                    semaphore.Dispose();
                }
            }
        }
    }

    public void Dispose()
    {
        foreach (var semaphore in _locks.Values) semaphore.Dispose();
        _locks.Clear();
        GC.SuppressFinalize(this);
    }
}
