using System.IO;
using System.IO.Compression;
using Aspose.Email.Mapi;
using Aspose.Email.Storage.Pst;
using PstConverter.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using Aspose.Email;
using System.Collections.Concurrent;
using System.Threading;

namespace PstConverter.Services;

public class PstService(IPstStoragePool pool, IDistributedCache cache, AppDbContext db, ILogger<PstService> logger, IServiceScopeFactory scopeFactory)
{
    private readonly string _uploadDir = StorageConstants.UploadDir;
    private readonly IPstStoragePool _pool = pool;
    private readonly IDistributedCache _cache = cache;
    private readonly AppDbContext _db = db;
    private readonly ILogger<PstService> _logger = logger;
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _uploadLocks = new();
    private static readonly ConcurrentDictionary<string, CancellationTokenSource> _conversionCts = new();

    private static void LogDebug(string message)
    {
        try
        {
            var logPath = @"C:\temp\debug_log.txt";
            File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] {message}{Environment.NewLine}");
            Console.WriteLine($"[DEBUG] {message}");
        }
        catch { }
    }

    private async Task<(string filePath, string? password)> GetSessionDataAsync(string sessionId, string userId)
    {
        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);

        if (session == null)
        {
            _logger.LogWarning("Session {SessionId} not found in DB at all.", sessionId);
            throw new FileNotFoundException("Session not found");
        }

        if (session.UserId != userId)
        {
            _logger.LogWarning("Unauthorized: Session {SessionId} belongs to '{OwnerId}', but request is from '{RequestId}'",
                sessionId, session.UserId, userId);
            throw new UnauthorizedAccessException("You do not have access to this session.");
        }

        // Redirect duplicate sessions to their original session
        if (session.Status == "Duplicate" && !string.IsNullOrEmpty(session.StoreGuid))
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);
            var originalSession = await _db.ConversionSessions
                .Where(x => x.UserId == userId && x.StoreGuid == session.StoreGuid && x.CreatedAt > cutoff && x.Status != "Duplicate" && x.SessionId != sessionId)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (originalSession != null)
            {
                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation("Redirecting duplicate session {DuplicateId} to original {OriginalId}", sessionId, originalSession.SessionId);
                }
                session = originalSession;
                sessionId = originalSession.SessionId;
            }
        }

        // Reject early if file assembly is still in progress or failed
        if (session.Status == "Assembling")
            throw new InvalidOperationException("File is still being assembled. Please wait a moment and try again.");

        if (session.Status == "AssemblyFailed")
            throw new InvalidOperationException("File assembly failed. Please re-upload the file.");

        // Update LastAccessedAt to keep session alive.
        // Swallow concurrency conflicts — two simultaneous requests may both try to update the
        // same row; whichever wins is fine, the session remains valid either way.
        try
        {
            session.LastAccessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            // Non-critical: another request already updated LastAccessedAt — ignore.
            _db.Entry(session).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        }

        var pstPath = Path.Combine(_uploadDir, $"{sessionId}.pst");
        if (File.Exists(pstPath)) return (pstPath, session.Password);
        var ostPath = Path.Combine(_uploadDir, $"{sessionId}.ost");
        if (File.Exists(ostPath)) return (ostPath, session.Password);

        // File is missing on disk (e.g. container volume was reset).
        // Mark the session so future requests immediately know without re-checking disk.
        _logger.LogWarning("Session {SessionId} exists in DB but file is missing on disk. Marking as FileGone.", sessionId);
        try
        {
            session.Status = "FileGone";
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not update session {SessionId} status to FileGone.", sessionId);
        }

        throw new FileNotFoundException("The session file is no longer available on this server. Please re-upload your file.");

    }

    public async Task<string> SaveUploadedFileAsync(Stream fileStream, string originalFileName, string userId, long size, string? password = null)
    {
        var sessionId = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (ext != ".ost") ext = ".pst";
        var filePath = Path.Combine(_uploadDir, $"{sessionId}{ext}");

        try
        {
            using (var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                await fileStream.CopyToAsync(fs);
            }

            var storeGuid = string.Empty;
            try
            {
                storeGuid = ExtractStoreGuid(filePath);
                if (!string.IsNullOrEmpty(storeGuid))
                {
                    // Check for existing successful session for this user and GUID in last 24h
                    var cutoff = DateTime.UtcNow.AddHours(-24);
                    var existing = await _db.ConversionSessions
                        .FirstOrDefaultAsync(s => s.UserId == userId && s.StoreGuid == storeGuid && s.CreatedAt > cutoff && s.Status == "Uploaded");

                    if (existing != null)
                    {
                        if (_logger.IsEnabled(LogLevel.Information))
                        {
                            _logger.LogInformation("Found existing session {SessionId} for StoreGuid {StoreGuid}. Reusing.", existing.SessionId, storeGuid);
                        }
                        TryDelete(filePath);
                        return existing.SessionId;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract StoreGuid during single upload");
            }

            var session = new ConversionSession
            {
                SessionId = sessionId,
                OriginalFileName = originalFileName,
                UserId = userId,
                Size = size,
                FileType = ext.TrimStart('.'),
                CreatedAt = DateTime.UtcNow,
                Status = "Uploaded",
                Password = password,
                StoreGuid = storeGuid
            };
            _db.ConversionSessions.Add(session);
            await _db.SaveChangesAsync();

            Console.WriteLine($"[UPLOAD] Session created: {sessionId}, Status: Uploaded");
            return sessionId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERROR during file upload");
            if (File.Exists(filePath)) TryDelete(filePath);
            throw;
        }
    }

    public async Task<string> InitChunkedUploadAsync(string originalFileName, string userId, int totalChunks, long totalSize)
    {
        var uploadId = Guid.NewGuid().ToString("N");
        var chunkDir = Path.Combine(_uploadDir, $"chunks_{uploadId}");
        Directory.CreateDirectory(chunkDir);

        var metadata = new ChunkedUploadMetadata
        {
            UploadId = uploadId,
            OriginalFileName = originalFileName,
            UserId = userId,
            TotalChunks = totalChunks,
            TotalSize = totalSize,
            ReceivedChunks = [],
            CreatedAt = DateTime.UtcNow
        };

        var metaPath = Path.Combine(chunkDir, "_metadata.json");
        await File.WriteAllTextAsync(metaPath, JsonSerializer.Serialize(metadata));

        Console.WriteLine($"[CHUNK] Initialized chunked upload: {uploadId}, Total Chunks: {totalChunks}, File: {originalFileName}");
        return uploadId;
    }

    public async Task<(bool success, int receivedCount)> SaveChunkAsync(string uploadId, string userId, int chunkIndex, Stream chunkStream)
    {
        var chunkDir = Path.Combine(_uploadDir, $"chunks_{uploadId}");
        if (!Directory.Exists(chunkDir)) throw new FileNotFoundException("Upload session not found");

        var metaPath = Path.Combine(chunkDir, "_metadata.json");
        ChunkedUploadMetadata metadata;
        try
        {
            using var fs = new FileStream(metaPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            metadata = await JsonSerializer.DeserializeAsync<ChunkedUploadMetadata>(fs)
                ?? throw new InvalidOperationException("Corrupted metadata");
        }
        catch (Exception)
        {
            throw;
        }

        if (metadata.UserId != userId) throw new UnauthorizedAccessException("You do not have access to this upload session.");

        if (chunkIndex == 0)
        {
            var ext = Path.GetExtension(metadata.OriginalFileName);
            if (!PstConverter.Endpoints.FileEndpoints.IsValidOutlookDataFile(chunkStream, ext))
            {
                throw new ArgumentException($"The file does not have a valid {ext.ToUpperInvariant().TrimStart('.')} signature.");
            }
        }


        var chunkPath = Path.Combine(chunkDir, $"chunk_{chunkIndex:D5}");
        using (var fs = new FileStream(chunkPath, FileMode.Create, FileAccess.Write))
        {
            await chunkStream.CopyToAsync(fs);
        }

        if (chunkIndex % 5 == 0 || chunkIndex == metadata.TotalChunks - 1)
        {
            Console.WriteLine($"[CHUNK] Received chunk {chunkIndex + 1}/{metadata.TotalChunks} for upload {uploadId}");
        }

        return (true, chunkIndex + 1);
    }

    public async Task AbortChunkedUploadAsync(string uploadId, string userId)
    {
        var chunkDir = Path.Combine(_uploadDir, $"chunks_{uploadId}");
        if (!Directory.Exists(chunkDir)) return;

        // Verify ownership (metadata is written in InitChunkedUploadAsync)
        var metaPath = Path.Combine(chunkDir, "_metadata.json");
        if (File.Exists(metaPath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(metaPath);
                var metadata = JsonSerializer.Deserialize<ChunkedUploadMetadata>(json);
                if (metadata != null && metadata.UserId != userId)
                {
                    throw new UnauthorizedAccessException("You do not have access to this upload session.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read metadata for aborted upload {UploadId}", uploadId);
            }
        }

        try
        {
            Directory.Delete(chunkDir, true);
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Aborted chunked upload {UploadId} and cleaned up directory.", uploadId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete chunk directory during abort for {UploadId}", uploadId);
            throw;
        }
    }

    public async Task<FinalizationResult> FinalizeChunkedUploadAsync(string uploadId, string userId)
    {
        var chunkDir = Path.Combine(_uploadDir, $"chunks_{uploadId}");
        if (!Directory.Exists(chunkDir)) throw new FileNotFoundException("Upload session not found");

        var uploadLock = _uploadLocks.GetOrAdd(uploadId, _ => new SemaphoreSlim(1, 1));
        await uploadLock.WaitAsync();
        ChunkedUploadMetadata metadata;
        try
        {
            var json = await File.ReadAllTextAsync(Path.Combine(chunkDir, "_metadata.json"));
            metadata = JsonSerializer.Deserialize<ChunkedUploadMetadata>(json)
                ?? throw new InvalidOperationException("Corrupted metadata");
        }
        finally
        {
            uploadLock.Release();
            _uploadLocks.TryRemove(uploadId, out _);
        }

        if (metadata.UserId != userId) throw new UnauthorizedAccessException("You do not have access to this upload session.");

        var sessionId = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(metadata.OriginalFileName).ToLowerInvariant();
        if (ext != ".ost") ext = ".pst";
        var finalPath = Path.Combine(_uploadDir, $"{sessionId}{ext}");

        var session = new ConversionSession
        {
            SessionId = sessionId,
            OriginalFileName = metadata.OriginalFileName,
            UserId = metadata.UserId,
            Size = metadata.TotalSize,
            FileType = ext.TrimStart('.'),
            CreatedAt = DateTime.UtcNow,
            Status = "Assembling",
            Password = null
        };
        _db.ConversionSessions.Add(session);
        await _db.SaveChangesAsync();

        Console.WriteLine($"[ASSEMBLY] Starting background assembly for session {sessionId}, Upload ID: {uploadId}");
        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;

        _ = Task.Run(async () =>
        {
            try
            {
                token.ThrowIfCancellationRequested();
                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation("Merging {Count} chunks for upload {UploadId} in background", metadata.TotalChunks, uploadId);
                }

                const int bufferSize = 1024 * 1024;
                using (var finalStream = new FileStream(finalPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize))
                {
                    for (int i = 0; i < metadata.TotalChunks; i++)
                    {
                        var chunkPath = Path.Combine(chunkDir, $"chunk_{i:D5}");
                        if (!File.Exists(chunkPath))
                        {
                            throw new FileNotFoundException($"Missing chunk {i} for upload {uploadId}");
                        }
                    }

                    finalStream.SetLength(metadata.TotalSize);

                    for (int i = 0; i < metadata.TotalChunks; i++)
                    {
                        var chunkPath = Path.Combine(chunkDir, $"chunk_{i:D5}");
                        using var chunkFs = new FileStream(chunkPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize);
                        await chunkFs.CopyToAsync(finalStream, bufferSize, token);
                    }
                }
                Console.WriteLine($"[ASSEMBLY] Merged {metadata.TotalChunks} chunks into {finalPath}");

                using (var scope = _scopeFactory.CreateScope())
                {
                    var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null && !token.IsCancellationRequested)
                    {
                        var storeGuid = string.Empty;
                        try
                        {
                            storeGuid = ExtractStoreGuid(finalPath);
                            if (!string.IsNullOrEmpty(storeGuid))
                            {
                                // Check for existing successful session for this user and GUID in last 24h
                                var cutoff = DateTime.UtcNow.AddHours(-24);
                                var existing = await updateDb.ConversionSessions
                                    .FirstOrDefaultAsync(x => x.UserId == userId && x.StoreGuid == storeGuid && x.CreatedAt > cutoff && x.Status == "Uploaded" && x.SessionId != sessionId);

                                if (existing != null)
                                {
                                    if (_logger.IsEnabled(LogLevel.Information))
                                    {
                                        _logger.LogInformation("Post-assembly: Found existing session {SessionId} for StoreGuid {StoreGuid}. Marking current session as Duplicate.", existing.SessionId, storeGuid);
                                    }
                                    s.StoreGuid = storeGuid;
                                    s.Status = "Duplicate";
                                    // Optionally we could update the SessionId returned to the user, 
                                    // but for background assembly it's easier to mark this as duplicate.
                                    await updateDb.SaveChangesAsync();
                                    TryDelete(finalPath);
                                    return;
                                }
                            }
                        }
                        catch (Exception ex) { _logger.LogWarning(ex, "Failed to extract StoreGuid after assembly"); }

                        s.StoreGuid = storeGuid;
                        s.Status = "Uploaded";
                        await updateDb.SaveChangesAsync();
                        Console.WriteLine($"[ASSEMBLY] Session {sessionId} is now READY");
                    }
                }

                try { Directory.Delete(chunkDir, true); } catch { }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[ASSEMBLY] Background assembly CANCELLED for {sessionId}");
                TryDelete(finalPath);
            }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Background assembly failed for session {SessionId}", sessionId);
                    using var scope = _scopeFactory.CreateScope();
                    var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null)
                    {
                        s.Status = "AssemblyFailed";
                        await updateDb.SaveChangesAsync();
                    }
                }
            }
            finally
            {
                _conversionCts.TryRemove(sessionId, out _);
                cts.Dispose();
            }
        }, token);

        return new FinalizationResult(sessionId, metadata.OriginalFileName, metadata.TotalSize, ext.TrimStart('.'));
    }

    public record FinalizationResult(string SessionId, string FileName, long Size, string FileType);

    public async Task<(string FilePath, string FileName, bool isReady)> ConvertOstToPstAsync(string sessionId, string userId, bool excludeEmptyFolders = false) => await ConvertStorageAsync(sessionId, userId, FileFormat.Pst, excludeEmptyFolders);
    public async Task<(string FilePath, string FileName, bool isReady)> ConvertPstToOstAsync(string sessionId, string userId, bool excludeEmptyFolders = false) => await ConvertStorageAsync(sessionId, userId, FileFormat.Ost, excludeEmptyFolders);

    private async Task<(string FilePath, string FileName, bool isReady)> ConvertStorageAsync(string sessionId, string userId, FileFormat format, bool excludeEmptyFolders = false)
    {
        var (srcPath, password) = await GetSessionDataAsync(sessionId, userId);

        string ext = format == FileFormat.Ost ? ".ost" : ".pst";
        var outputPath = Path.Combine(_uploadDir, $"{sessionId}_converted{ext}");

        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        var baseName = session != null
            ? Path.GetFileNameWithoutExtension(session.OriginalFileName)
            : sessionId;
        var fileName = $"{baseName}_converted{ext}";

        if (session != null && session.Status == "Converting")
        {
            return (outputPath, fileName, false);
        }

        if (File.Exists(outputPath))
        {
            return (outputPath, fileName, true);
        }

        Console.WriteLine($"[CONVERT] Starting BACKGROUND conversion for session {sessionId} to {format}");

        if (session != null)
        {
            session.Status = "Converting";
            await _db.SaveChangesAsync();
        }

        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;

        _ = Task.Run(async () =>
        {
            try
            {
                await _pool.AccessAsync(sessionId, srcPath, srcStorage =>
                {
                    if (File.Exists(outputPath)) TryDelete(outputPath);

                    using (var destStorage = PersonalStorage.Create(outputPath, FileFormatVersion.Unicode))
                    {
                        CopyFolders(srcStorage.RootFolder, destStorage.RootFolder, srcStorage, excludeEmptyFolders, token);
                    }
                    return Task.FromResult(true);
                }, password);

                using var scope = _scopeFactory.CreateScope();
                var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (s != null && !token.IsCancellationRequested)
                {
                    s.Status = "Uploaded"; // Reset to Uploaded or a new "Converted" state
                    await updateDb.SaveChangesAsync();
                }
                Console.WriteLine($"[CONVERT] Background conversion complete for {sessionId}");
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[CONVERT] Background conversion CANCELLED for {sessionId}");
                TryDelete(outputPath);
            }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Background conversion failed for session {SessionId}", sessionId);
                    using var scope = _scopeFactory.CreateScope();
                    var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null)
                    {
                        s.Status = "ConversionFailed";
                        await updateDb.SaveChangesAsync();
                    }
                }
            }
            finally
            {
                _conversionCts.TryRemove(sessionId, out _);
                cts.Dispose();
            }
        }, token);

        return (outputPath, fileName, false);
    }

    private static void CopyFolders(FolderInfo source, FolderInfo destParent, PersonalStorage srcPst, bool excludeEmptyFolders = false, CancellationToken token = default)
    {
        foreach (var srcFolder in source.GetSubFolders())
        {
            token.ThrowIfCancellationRequested();
            if (excludeEmptyFolders)
            {
                var totalMessages = GetTotalMessageCount(srcFolder);
                if (totalMessages == 0) continue;
            }

            var newFolder = destParent.AddSubFolder(srcFolder.DisplayName);
            foreach (var msgInfo in srcFolder.GetContents())
            {
                token.ThrowIfCancellationRequested();
                using var msg = srcPst.ExtractMessage(msgInfo.EntryIdString);
                if (msg != null)
                {
                    newFolder.AddMessage(msg);
                }
            }
            CopyFolders(srcFolder, newFolder, srcPst, excludeEmptyFolders, token);
        }
    }

    private static int GetTotalMessageCount(FolderInfo folder)
    {
        int count = folder.ContentCount;
        foreach (var sub in folder.GetSubFolders())
        {
            count += GetTotalMessageCount(sub);
        }
        return count;
    }

    public async Task<List<PstFolderInfo>> GetFolderTreeAsync(string sessionId, string userId, bool excludeEmptyFolders = false)
    {
        var cacheKey = $"pst_folders_{sessionId}_{excludeEmptyFolders}";
        var cached = _cache.GetString(cacheKey);
        if (cached != null) return JsonSerializer.Deserialize<List<PstFolderInfo>>(cached) ?? [];

        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        var tree = await _pool.AccessAsync(sessionId, filePath, pst => Task.FromResult(BuildFolderTree(pst.RootFolder, excludeEmptyFolders)), password);

        tree = FlattenFolderTree(tree);

        _cache.SetString(cacheKey, JsonSerializer.Serialize(tree), new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(30) });
        return tree;
    }

    private static List<PstFolderInfo> BuildFolderTree(FolderInfo folder, bool excludeEmpty = false)
    {
        var result = new List<PstFolderInfo>();
        foreach (var sub in folder.GetSubFolders())
        {
            var subTree = BuildFolderTree(sub, excludeEmpty);
            var totalMessages = sub.ContentCount + subTree.Sum(f => f.TotalMessageCount);
            if (excludeEmpty && totalMessages == 0) continue;

            result.Add(new PstFolderInfo
            {
                FolderId = sub.EntryIdString,
                DisplayName = sub.DisplayName,
                MessageCount = sub.ContentCount,
                SubFolders = subTree,
                TotalMessageCount = totalMessages,
                FolderClass = sub.ContainerClass
            });
        }
        return result;
    }

    private static List<PstFolderInfo> FlattenFolderTree(List<PstFolderInfo> folders)
    {
        if (folders == null || folders.Count == 0) return folders ?? [];

        var structural = folders.FirstOrDefault(f =>
            f.DisplayName.Contains("IPM_SUBTREE", StringComparison.OrdinalIgnoreCase) ||
            f.DisplayName.StartsWith("Top of", StringComparison.OrdinalIgnoreCase) ||
            f.DisplayName.Contains("Root - Mailbox", StringComparison.OrdinalIgnoreCase));

        if (structural != null)
        {
            return FlattenFolderTree(structural.SubFolders);
        }

        while (folders.Count == 1)
        {
            var single = folders[0];
            if (single.MessageCount == 0 && single.SubFolders.Count > 0)
            {
                folders = single.SubFolders;
            }
            else
            {
                break;
            }
        }

        return folders;
    }

    public async Task<List<PstMessageSummary>> GetMessagesAsync(string sessionId, string userId, string folderId, MessageDateFilter? filter = null, string? sortBy = "date", string? sortOrder = "desc")
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstMessageSummary>());

            LogDebug($"GetMessagesAsync: Folder '{folder.DisplayName}', ContentCount={folder.ContentCount}");
            var list = new List<PstMessageSummary>();
            var contents = folder.GetContents();
            LogDebug($"GetMessagesAsync: GetContents() returned {contents.Count} items");

            foreach (var msgInfo in contents)
            {
                DateTime date = DateTime.MinValue;
                if (msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME))
                    date = msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME].GetDateTime();

                if (filter != null && !filter.IsEmpty() && !filter.Matches(date)) continue;

                list.Add(new PstMessageSummary
                {
                    EntryId = msgInfo.EntryIdString,
                    Subject = msgInfo.Subject ?? "(No Subject)",
                    From = msgInfo.SenderRepresentativeName ?? "",
                    To = msgInfo.DisplayTo ?? "",
                    Date = date,
                    Size = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_SIZE) ? msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_SIZE].GetLong() : 0,
                    HasAttachments = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_HASATTACH) && msgInfo.Properties[MapiPropertyTag.PR_HASATTACH].GetBoolean()
                });
            }

            // Apply sorting
            if (sortBy?.ToLower() == "date")
            {
                if (sortOrder?.ToLower() == "asc")
                    list = [.. list.OrderBy(m => m.Date)];
                else
                    list = [.. list.OrderByDescending(m => m.Date)];
            }
            else if (sortBy?.ToLower() == "subject")
            {
                if (sortOrder?.ToLower() == "asc")
                    list = [.. list.OrderBy(m => m.Subject)];
                else
                    list = [.. list.OrderByDescending(m => m.Subject)];
            }

            return Task.FromResult(list);
        }, password);
    }

    public async Task<PstMessageDetail?> GetMessageDetailAsync(string sessionId, string userId, string entryId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var msg = pst.ExtractMessage(entryId);
            if (msg == null) return Task.FromResult<PstMessageDetail?>(null);

            return Task.FromResult<PstMessageDetail?>(new PstMessageDetail
            {
                EntryId = entryId,
                Subject = msg.Subject ?? "(No Subject)",
                From = msg.SenderEmailAddress ?? "",
                To = msg.DisplayTo ?? "",
                Cc = msg.DisplayCc ?? "",
                Date = msg.DeliveryTime,
                BodyHtml = msg.BodyHtml ?? "",
                BodyText = msg.Body ?? "",
                Attachments = [.. msg.Attachments.Select(att => new AttachmentInfo {
                        FileName = att.LongFileName ?? att.DisplayName ?? "attachment",
                        Size = att.BinaryData?.Length ?? 0,
                        ContentType = att.MimeTag ?? "application/octet-stream"
                    })]
            });
        }, password);
    }

    public async Task<List<PstContactInfo>> GetContactsAsync(string sessionId, string userId, string folderId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstContactInfo>());

            var list = new List<PstContactInfo>();
            foreach (var msgInfo in folder.GetContents())
            {
                if (msgInfo.MessageClass != "IPM.Contact") continue;
                var contact = (MapiContact)pst.ExtractMessage(msgInfo.EntryIdString).ToMapiMessageItem();
                list.Add(new PstContactInfo
                {
                    EntryId = msgInfo.EntryIdString,
                    DisplayName = contact.NameInfo?.DisplayName ?? "",
                    Email = contact.ElectronicAddresses?.Email1?.EmailAddress ?? "",
                    Company = contact.ProfessionalInfo?.CompanyName ?? "",
                    Phone = contact.Telephones?.BusinessTelephoneNumber ?? ""
                });
            }
            return Task.FromResult(list);
        }, password);
    }

    public async Task<List<PstCalendarInfo>> GetCalendarItemsAsync(string sessionId, string userId, string folderId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstCalendarInfo>());

            var list = new List<PstCalendarInfo>();
            foreach (var msgInfo in folder.GetContents())
            {
                if (msgInfo.MessageClass != "IPM.Appointment") continue;
                var appt = (MapiCalendar)pst.ExtractMessage(msgInfo.EntryIdString).ToMapiMessageItem();
                list.Add(new PstCalendarInfo
                {
                    EntryId = msgInfo.EntryIdString,
                    Subject = appt.Subject ?? "",
                    StartDate = appt.StartDate,
                    EndDate = appt.EndDate,
                    Location = appt.Location ?? ""
                });
            }
            return Task.FromResult(list);
        }, password);
    }

    public async Task ExportMessageAsync(Stream outputStream, string sessionId, string userId, string entryId, ExportFormat format)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var msg = pst.ExtractMessage(entryId) ?? throw new FileNotFoundException("Message not found");
            SaveMessageToStream(msg, outputStream, format);
            return Task.FromResult(true);
        }, password);
    }

    public async Task<string> ExportFolderAsync(string sessionId, string userId, string folderId, ExportFormat format, MessageDateFilter? filter = null)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        var tempZipPath = Path.Combine(_uploadDir, $"export_{sessionId}_{Guid.NewGuid():N}.zip");
        await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId) ?? throw new FileNotFoundException("Folder not found");
            using (var fs = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write, FileShare.None))
            using (var archive = new ZipArchive(fs, ZipArchiveMode.Create, true))
            {
                int index = 0;
                foreach (var msgInfo in folder.GetContents())
                {
                    DateTime date = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME) ? msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME].GetDateTime() : DateTime.MinValue;
                    if (filter != null && !filter.IsEmpty() && !filter.Matches(date)) continue;

                    using var msg = pst.ExtractMessage(msgInfo.EntryIdString);
                    index++;
                    var entry = archive.CreateEntry($"{SanitizeFileName(msg.Subject ?? $"msg_{index}")}_{index}{GetFileExtension(format)}");
                    using var es = entry.Open();
                    SaveMessageToStream(msg, es, format);
                }
            }
            return Task.FromResult(true);
        }, password);
        return tempZipPath;
    }

    public async Task<(string FilePath, bool isReady)> ExportAllAsync(string sessionId, string userId, ExportFormat format, string? folderId = null, List<string>? entryIds = null, MessageDateFilter? filter = null, bool excludeEmptyFolders = false)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        string suffix = "";
        if (!string.IsNullOrEmpty(folderId)) suffix += $"_f_{folderId}";
        if (entryIds != null && entryIds.Count > 0)
        {
            // Use a stable hash of sorted IDs to ensure consistent filenames across restarts
            var idHash = GetStableHash(string.Join(",", entryIds.OrderBy(x => x)));
            suffix += $"_sel_{entryIds.Count}_{idHash}";
        }
        if (filter != null && !filter.IsEmpty())
        {
            suffix += $"_fltr_{filter.Year}_{filter.Month}";
        }

        var tempZipPath = Path.Combine(_uploadDir, $"export_{sessionId}_{format}{suffix}_{excludeEmptyFolders}.zip");

        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);

        // Per-task status check
        string exportingStatus = $"Exporting{suffix}";
        string readyStatus = $"Ready{suffix}";

        bool isFinished = session != null && session.Status == readyStatus;

        if (session != null && session.Status == exportingStatus)
        {
            LogDebug($"ExportAllAsync: Task for {suffix} is currently exporting.");
            return (tempZipPath, false);
        }

        if (File.Exists(tempZipPath) && isFinished)
        {
            LogDebug($"ExportAllAsync: Task for {suffix} is already ready.");
            return (tempZipPath, true);
        }

        if (session != null)
        {
            LogDebug($"ExportAllAsync: Starting new export task for {suffix}. Setting status to {exportingStatus}");
            session.Status = exportingStatus;
            await _db.SaveChangesAsync();
        }

        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;

        _ = Task.Run(async () =>
        {
            try
            {
                await _pool.AccessAsync(sessionId, filePath, pst =>
                {
                    using (var fs = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write, FileShare.None))
                    using (var archive = new ZipArchive(fs, ZipArchiveMode.Create, true))
                    {
                        if (entryIds != null && entryIds.Count > 0)
                        {
                            LogDebug($"ExportAllAsync: Processing {entryIds.Count} selected entryIds");
                            int index = 0;
                            foreach (var entryId in entryIds)
                            {
                                token.ThrowIfCancellationRequested();
                                try
                                {
                                    using var msg = pst.ExtractMessage(entryId);
                                    if (msg == null)
                                    {
                                        LogDebug($"ExportAllAsync: ExtractMessage returned null for {entryId}");
                                        continue;
                                    }
                                    index++;
                                    var entry = archive.CreateEntry($"{SanitizeFileName(msg.Subject ?? $"msg_{index}")}_{index}{GetFileExtension(format)}");
                                    using var es = entry.Open();
                                    SaveMessageToStream(msg, es, format);
                                }
                                catch (Exception ex)
                                {
                                    LogDebug($"ExportAllAsync: Error extracting {entryId}: {ex.Message}");
                                    continue;
                                }
                            }
                            LogDebug($"ExportAllAsync: Successfully extracted {index} messages");
                        }
                        else
                        {
                            var root = string.IsNullOrEmpty(folderId) ? pst.RootFolder : pst.GetFolderById(folderId);
                            if (root != null)
                            {
                                ExportFolderRecursive(pst, root, "", format, archive, filter, excludeEmptyFolders, token);
                            }
                        }
                    }
                    return Task.FromResult(true);
                }, password);

                using var scope = _scopeFactory.CreateScope();
                var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (s != null && !token.IsCancellationRequested)
                {
                    LogDebug($"ExportAllAsync: Background task complete for {suffix}. Setting status to {readyStatus}");
                    s.Status = readyStatus;
                    await updateDb.SaveChangesAsync();
                }
            }
            catch (OperationCanceledException) { TryDelete(tempZipPath); }
            catch (Exception ex)
            {
                LogDebug($"ExportAllAsync: Background exception for {suffix}: {ex.Message}{Environment.NewLine}{ex.StackTrace}");
                if (!token.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Background export failed for session {SessionId}", sessionId);
                    using var scope = _scopeFactory.CreateScope();
                    var updateDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var s = await updateDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null)
                    {
                        s.Status = "ExportFailed";
                        await updateDb.SaveChangesAsync();
                    }
                }
            }
            finally
            {
                _conversionCts.TryRemove(sessionId, out _);
                cts.Dispose();
            }
        }, token);

        return (tempZipPath, false);
    }

    private static void ExportFolderRecursive(PersonalStorage pst, FolderInfo folder, string path, ExportFormat format, ZipArchive archive, MessageDateFilter? filter = null, bool excludeEmpty = false, CancellationToken token = default)
    {
        token.ThrowIfCancellationRequested();
        if (excludeEmpty && GetTotalMessageCount(folder, filter) == 0) return;

        if (!string.IsNullOrEmpty(path)) archive.CreateEntry(path + "/");

        int index = 0;
        foreach (var msgInfo in folder.GetContents())
        {
            token.ThrowIfCancellationRequested();
            DateTime date = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME) ? msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME].GetDateTime() : DateTime.MinValue;
            if (filter != null && !filter.IsEmpty() && !filter.Matches(date)) continue;

            using var msg = pst.ExtractMessage(msgInfo.EntryIdString);
            index++;
            var name = $"{SanitizeFileName(msg.Subject ?? $"msg_{index}")}_{index}{GetFileExtension(format)}";
            var entry = archive.CreateEntry(string.IsNullOrEmpty(path) ? name : $"{path}/{name}");
            using var es = entry.Open();
            SaveMessageToStream(msg, es, format);
        }

        foreach (var sub in folder.GetSubFolders())
        {
            ExportFolderRecursive(pst, sub, string.IsNullOrEmpty(path) ? sub.DisplayName : $"{path}/{sub.DisplayName}", format, archive, filter, excludeEmpty, token);
        }
    }

    private static int GetTotalMessageCount(FolderInfo folder, MessageDateFilter? filter)
    {
        if (filter == null || filter.IsEmpty()) return GetTotalMessageCount(folder);
        int count = 0;
        foreach (var msgInfo in folder.GetContents())
        {
            DateTime date = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME) ? msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME].GetDateTime() : DateTime.MinValue;
            if (filter.Matches(date)) count++;
        }
        foreach (var sub in folder.GetSubFolders()) count += GetTotalMessageCount(sub, filter);
        return count;
    }

    public async Task CleanUpAsync(string sessionId)
    {
        if (_conversionCts.TryRemove(sessionId, out var cts)) { cts.Cancel(); cts.Dispose(); }
        await _pool.RemoveAsync(sessionId);
        foreach (var ext in (string[])[".pst", ".ost"])
        {
            TryDelete(Path.Combine(_uploadDir, $"{sessionId}{ext}"));
            TryDelete(Path.Combine(_uploadDir, $"{sessionId}_converted{ext}"));
        }
        var zipFiles = Directory.GetFiles(_uploadDir, $"export_{sessionId}_*.zip");
        foreach (var zip in zipFiles) TryDelete(zip);
    }

    public async Task CancelBackgroundTaskAsync(string sessionId)
    {
        if (_conversionCts.TryRemove(sessionId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
            var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
            if (session != null && (session.Status == "Converting" || session.Status == "Exporting" || session.Status == "Assembling"))
            {
                session.Status = "Uploaded";
                await _db.SaveChangesAsync();
            }
        }
    }

    private static void SaveMessageToStream(MapiMessage msg, Stream stream, ExportFormat format)
    {
        using var ms = new MemoryStream();
        switch (format)
        {
            case ExportFormat.Eml:
                msg.Save(ms, Aspose.Email.SaveOptions.DefaultEml);
                break;
            case ExportFormat.Msg:
            case ExportFormat.Oft:
                msg.Save(ms, Aspose.Email.SaveOptions.DefaultMsgUnicode);
                break;
            case ExportFormat.Html:
                msg.Save(ms, Aspose.Email.SaveOptions.DefaultHtml);
                break;
            case ExportFormat.Mhtml:
                msg.Save(ms, Aspose.Email.SaveOptions.DefaultMhtml);
                break;
            case ExportFormat.Mbox:
                using (var mailMsg = msg.ToMailMessage(new MailConversionOptions()))
                using (var writer = new Aspose.Email.Storage.Mbox.MboxrdStorageWriter(ms, new Aspose.Email.Storage.Mbox.MboxSaveOptions()))
                {
                    writer.WriteMessage(mailMsg);
                }
                break;
            default:
                throw new ArgumentException($"Unsupported format: {format}");
        }
        ms.Position = 0;
        ms.CopyTo(stream);
    }

    private static string GetFileExtension(ExportFormat format) => format switch
    {
        ExportFormat.Eml => ".eml",
        ExportFormat.Msg => ".msg",
        ExportFormat.Html => ".html",
        ExportFormat.Mhtml => ".mhtml",
        ExportFormat.Mbox => ".mbox",
        ExportFormat.Oft => ".oft",
        _ => ".eml"
    };

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string([.. name.Where(c => !invalid.Contains(c))]);
        return string.IsNullOrWhiteSpace(sanitized) ? "message" : sanitized.Trim();
    }

    private static string ExtractStoreGuid(string filePath)
    {
        try
        {
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var buffer = new byte[1024 * 1024];
            var read = fs.Read(buffer, 0, buffer.Length);
            var hashBytes = System.Security.Cryptography.SHA256.HashData(buffer.AsSpan(0, read));
            return $"{Convert.ToHexString(hashBytes).ToLowerInvariant()}_{fs.Length}";
        }
        catch { return string.Empty; }
    }

    private static string GetStableHash(string input)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant()[..8];
    }

    private static void TryDelete(string path)
    {
        if (string.IsNullOrEmpty(path) || !File.Exists(path)) return;
        for (int i = 0; i < 3; i++)
        {
            try { File.Delete(path); return; }
            catch (IOException) { if (i < 2) Thread.Sleep(500); }
            catch { return; }
        }
    }
}
