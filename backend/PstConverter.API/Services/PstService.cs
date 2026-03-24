using System.IO;
using System.Text;
using System.IO.Compression;
using Aspose.Email.Storage.Pst;
using PstConverter.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using Aspose.Email;
using Aspose.Email.Tools.Search;
using System.Collections.Concurrent;
using System.Threading;
using Task = System.Threading.Tasks.Task;
using Aspose.Words;
using Aspose.Email.Calendar;
using Aspose.Email.Mapi;

namespace PstConverter.Services;


public class PstService(IPstStoragePool pool, IDistributedCache cache, AppDbContext db, ILogger<PstService> loggerService, IServiceScopeFactory scopeFactory, LicenseApiClient licenseClient, IConfiguration config)
{
    private readonly string _uploadDir = StorageConstants.UploadDir;//for upload directory
    private readonly IPstStoragePool _pool = pool;
    private readonly IDistributedCache _cache = cache;
    private readonly AppDbContext _db = db;
    private readonly ILogger<PstService> _logger = loggerService;
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly LicenseApiClient _licenseClient = licenseClient;
    private readonly IConfiguration _config = config;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _uploadLocks = new();
    private static readonly ConcurrentDictionary<string, CancellationTokenSource> _conversionCts = new();
    private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };
    public string OriginalFileName { get; private set; } = "";
    public long FileSize { get; private set; } = 0;
    /*
    /// <summary>
    /// Logs a debug message to the console with a timestamp.
    /// </summary>
    /// <param name="msg">The message to log.</param>
    private static void LogDebug(string msg)
    {
        // Use Console.WriteLine so background task progress is visible in the server logs.
        Console.WriteLine($"[PstService] {DateTime.Now:HH:mm:ss} {msg}");
    }
    */
    /// <summary>
    /// Retrieves session data including file path and password for a given session and user.
    /// </summary>
    /// <param name="sessionId">The unique identifier for the conversion session.</param>
    /// <param name="userId">The ID of the user requesting the session data.</param>
    /// <returns>A tuple containing the file path and the optional password.</returns>
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
            session.LastAccessedAt = DateTime.Now;
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
    /// <summary>
    /// Saves an uploaded file to the local storage and creates a new conversion session.
    /// </summary>
    /// <param name="fileStream">The stream containing the file data.</param>
    /// <param name="originalFileName">The original name of the uploaded file.</param>
    /// <param name="userId">The ID of the user who uploaded the file.</param>
    /// <param name="size">The size of the uploaded file in bytes.</param>
    /// <param name="userEmail">Optional email of the user.</param>
    /// <param name="password">Optional password for the PST/OST file.</param>
    /// <returns>The unique session ID for the uploaded file.</returns>
    public async Task<string> SaveUploadedFileAsync(Stream fileStream, string originalFileName, string userId, long size, string? userEmail = null, string? password = null)
    {
        var sessionId = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (ext != ".ost") ext = ".pst";
        var filePath = Path.Combine(_uploadDir, $"{sessionId}{ext}");
        OriginalFileName = originalFileName;
        FileSize = size;
        try
        {
            using (var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                await fileStream.CopyToAsync(fs);
            }


            var session = new ConversionSession
            {
                SessionId = sessionId,
                OriginalFileName = originalFileName,
                UserId = userId,
                Size = size,
                FileType = ext.TrimStart('.'),
                CreatedAt = DateTime.Now,
                Status = "Uploaded",
                Password = password,
                Email = userEmail ?? userId,
                StoreGuid = string.Empty
            };
            _db.ConversionSessions.Add(session);
            await _db.SaveChangesAsync();
            // Console.WriteLine($"[UPLOAD] Session created: {sessionId}, Status: Uploaded");
            return sessionId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERROR during file upload");
            if (File.Exists(filePath)) TryDelete(filePath);
            throw;
        }
    }
    /// <summary>
    /// Initializes a chunked upload process.
    /// </summary>
    /// <param name="originalFileName">The original name of the file being uploaded.</param>
    /// <param name="userId">The ID of the user initiating the upload.</param>
    /// <param name="totalChunks">The total number of chunks expected.</param>
    /// <param name="totalSize">The total size of the file in bytes.</param>
    /// <returns>A unique upload ID for the chunked session.</returns>
    public async Task<string> InitChunkedUploadAsync(string originalFileName, string userId, int totalChunks, long totalSize, string? userEmail = null)
    {
        var uploadId = Guid.NewGuid().ToString("N");
        var chunkDir = Path.Combine(_uploadDir, $"chunks_{uploadId}");
        Directory.CreateDirectory(chunkDir);

        var metadata = new ChunkedUploadMetadata
        {
            UploadId = uploadId,
            OriginalFileName = originalFileName,
            UserId = userId,
            UserEmail = userEmail,
            TotalChunks = totalChunks,
            TotalSize = totalSize,
            ReceivedChunks = [],
            CreatedAt = DateTime.Now
        };

        var metaPath = Path.Combine(chunkDir, "_metadata.json");
        await File.WriteAllTextAsync(metaPath, JsonSerializer.Serialize(metadata));

        // Console.WriteLine($"[CHUNK] Initialized chunked upload: {uploadId}, Total Chunks: {totalChunks}, File: {originalFileName}");
        return uploadId;
    }
    /// <summary>
    /// Saves an individual chunk of a chunked upload.
    /// </summary>
    /// <param name="uploadId">The unique ID of the chunked upload session.</param>
    /// <param name="userId">The ID of the user uploading the chunk.</param>
    /// <param name="chunkIndex">The zero-based index of the chunk.</param>
    /// <param name="chunkStream">The stream containing the chunk data.</param>
    /// <returns>A tuple indicating success and the total number of chunks received so far.</returns>
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
            // Console.WriteLine($"[CHUNK] Received chunk {chunkIndex + 1}/{metadata.TotalChunks} for upload {uploadId}");
        }

        return (true, chunkIndex + 1);
    }
    /// <summary>
    /// Aborts a chunked upload session and cleans up temporary files.
    /// </summary>
    /// <param name="uploadId">The unique ID of the chunked upload session.</param>
    /// <param name="userId">The ID of the user aborting the upload.</param>
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
    /// <summary>
    /// Finalizes a chunked upload by merging all chunks into a single file and creating a conversion session.
    /// </summary>
    /// <param name="uploadId">The unique ID of the chunked upload session.</param>
    /// <param name="userId">The ID of the user finalizing the upload.</param>
    /// <param name="userEmail">Optional email of the user.</param>
    /// <returns>A result object containing the session ID and file metadata.</returns>
    public async Task<FinalizationResult> FinalizeChunkedUploadAsync(string uploadId, string userId, string? userEmail = null)
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
            CreatedAt = DateTime.Now,
            Status = "Assembling",
            Password = null,
            Email = metadata.UserEmail ?? userEmail ?? metadata.UserId
        };
        _db.ConversionSessions.Add(session);
        await _db.SaveChangesAsync();

        // Track storage for professional users
        //_ = _licenseClient.UpdateStorageAsync(userEmail ?? userId, "1", metadata.TotalSize); //check for later license api

        // Console.WriteLine($"[ASSEMBLY] Starting background assembly for session {sessionId}, Upload ID: {uploadId}");
        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;


        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
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

                var s = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (s != null && !token.IsCancellationRequested)
                {
                    s.Status = "Uploaded";
                    s.StoreGuid = string.Empty;
                    await scopedDb.SaveChangesAsync();
                }

                try { Directory.Delete(chunkDir, true); } catch { }
            }
            catch (OperationCanceledException)
            {
                TryDelete(finalPath);
            }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Background assembly failed for session {SessionId}", sessionId);
                    var s = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null)
                    {
                        s.Status = "AssemblyFailed";
                        await scopedDb.SaveChangesAsync();
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
    /// <summary>
    /// Represents the result of a finalized chunked upload.
    /// </summary>
    public record FinalizationResult(string SessionId, string FileName, long Size, string FileType);
    /// <summary>
    /// Converts an OST file to a PST file.
    /// </summary>
    /// <param name="sessionId">The session ID of the file to convert.</param>
    /// <param name="userId">The ID of the user requesting conversion.</param>
    /// <param name="excludeEmptyFolders">Whether to exclude empty folders in the output.</param>
    /// <param name="userEmail">Optional email of the user.</param>
    /// <param name="deduplicate">Whether to remove duplicate messages during conversion.</param>
    /// <param name="splitSizeMb">Optional size in MB to split the resulting PST into multiple parts.</param>
    /// <returns>A tuple containing the output path, filename, and whether it's ready.</returns>
    public async Task<(string FilePath, string FileName, bool isReady)> ConvertOstToPstAsync(string sessionId,
                                                                                             string userId,
                                                                                             bool isDemo,
                                                                                             bool excludeEmptyFolders = false,
                                                                                             string? userEmail = null,
                                                                                             bool deduplicate = false,
                                                                                             long? splitSizeMb = null)
    {
        return await ConvertStorageAsync(sessionId,
                                         userId,
                                         isDemo,
                                         excludeEmptyFolders,
                                         userEmail,
                                         deduplicate,
                                         splitSizeMb);
    }

    /// <summary>
    /// Returns the absolute path to the upload directory.
    /// </summary>
    public string GetUploadDir() => _uploadDir;
    /*
    /// <summary>
    /// Attempts to repair a PST/OST storage file.
    /// </summary>
    /// <param name="sessionId">The session ID of the file to repair.</param>
    /// <param name="userId">The ID of the user requesting the repair.</param>
    public async Task RepairStorageAsync(string sessionId, string userId)
    {
        var (srcPath, password) = await GetSessionDataAsync(sessionId, userId);
        await _pool.AccessAsync(sessionId, srcPath, pst =>
        {
            // In Aspose.Email, opening with PersonalStorageLoadOptions and specific flags can help "repair"
            // But usually just re-saving or splitting/merging is a form of repair.
            // We'll simulate a header fix request by ensuring the file is opened/closed cleanly.
            return Task.FromResult(true);
        }, password);
    }
    */
    /// <summary>
    /// Splits a PST file into smaller chunks based on the specified size.
    /// </summary>
    /// <param name="sessionId">The session ID of the file to split.</param>
    /// <param name="userId">The ID of the user requesting the split.</param>
    /// <param name="chunkSizeMb">The maximum size of each chunk in megabytes.</param>
    /// <returns>A list of paths to the split PST files.</returns>
    public async Task<List<string>> SplitPstAsync(string sessionId, string userId, long chunkSizeMb)
    {
        var (srcPath, password) = await GetSessionDataAsync(sessionId, userId);
        var outputPaths = new List<string>();

        await _pool.AccessAsync(sessionId, srcPath, pst =>
        {
            var tempDir = Path.Combine(_uploadDir, $"split_{sessionId}");
            Directory.CreateDirectory(tempDir);
            pst.SplitInto(chunkSizeMb * 1024 * 1024, tempDir);
            outputPaths.AddRange(Directory.GetFiles(tempDir, "*.pst"));
            return Task.FromResult(true);
        }, password);

        return outputPaths;
    }
    /// <summary>
    /// Core method to handle conversion and processing of PST/OST storage files.
    /// </summary>

    //this is the main method that handles the conversion of PST/OST files.
    private async Task<(string FilePath, string FileName, bool isReady)> ConvertStorageAsync(string sessionId,
                                                                                            string userId,
                                                                                            bool isDemo,
                                                                                            bool excludeEmptyFolders = false,
                                                                                            string? userEmail = null,
                                                                                            bool deduplicate = false,
                                                                                            long? splitSizeMb = null)
    {
        var (srcPath, password) = await GetSessionDataAsync(sessionId, userId);
        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);

        var licenseId = userEmail;
        if (string.IsNullOrEmpty(licenseId) || licenseId.StartsWith("user_"))
        {
            if (session != null && !string.IsNullOrEmpty(session.Email) && !session.Email.StartsWith("user_"))
            {
                licenseId = session.Email;
            }
        }
        if (string.IsNullOrEmpty(licenseId)) licenseId = userId;
        licenseId = licenseId.ToLowerInvariant();
        // Construct the unique item name (OriginalFileName + Size)
        var itemName = session?.OriginalFileName != null ? $"{session.OriginalFileName}{session.Size}" : null;
        if (string.IsNullOrEmpty(itemName))
        {
            _logger.LogWarning("[PstService] Cannot determine ItemName for session {SessionId}.", sessionId);
        }

        // Get detailed license status (checks CanConvert, limits, etc.)
        var licenseStatus = await _licenseClient.GetDetailedLicenseStatusAsync(licenseId, itemName);
        if (!licenseStatus.CanConvert)
        {
            throw new Exception("License limit exceeded");
        }
        int exportLimit = -1;
        if (isDemo)
        {
            exportLimit = AllConstants.DemoExportLimit;
        }
        // --------------------------------------------------

        string ext = ".pst";
        var outputPath = Path.Combine(_uploadDir, $"{sessionId}_converted_{exportLimit}{(deduplicate ? "_dedup" : "")}{ext}");

        session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        var baseName = session != null
            ? Path.GetFileNameWithoutExtension(session.OriginalFileName)
            : sessionId;
        var fileName = $"{baseName}_converted{ext}";

        if (session != null && session.Status == "Converting")
        {
            return (outputPath, fileName, false);
        }

        if (File.Exists(outputPath) && session != null && session.Status == "Ready")
        {
            return (outputPath, fileName, true);
        }

        // Console.WriteLine($"[CONVERT] Starting BACKGROUND conversion for session {sessionId} to {format}");
        if (session != null)
        {
            session.Status = "Converting";
            await _db.SaveChangesAsync();
        }

        // IMPROVEMENT: Cancel any existing task for this session to prevent resource contention
        if (_conversionCts.TryRemove(sessionId, out var existingCts))
        {
            try { existingCts.Cancel(); existingCts.Dispose(); } catch { }
        }

        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;

        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            try
            {
                // 1. Fetch complete session info
                var sessionInfo = await scopedDb.ConversionSessions.AsNoTracking().FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (sessionInfo == null)
                {
                    await Task.Delay(500);
                    sessionInfo = await scopedDb.ConversionSessions.AsNoTracking().FirstOrDefaultAsync(s => s.SessionId == sessionId);
                }

                var backgroundUserId = userEmail;
                if (string.IsNullOrEmpty(backgroundUserId) || backgroundUserId.StartsWith("user_"))
                {
                    if (sessionInfo != null && !string.IsNullOrEmpty(sessionInfo.Email) && !sessionInfo.Email.StartsWith("user_"))
                    {
                        backgroundUserId = sessionInfo.Email;
                    }
                }
                if (string.IsNullOrEmpty(backgroundUserId))
                {
                    backgroundUserId = (userId ?? _config["LicenseApi:UserId"] ?? "unauthenticated");
                }
                backgroundUserId = backgroundUserId.ToLowerInvariant();

                _logger.LogInformation("[PstService] Background conversion starting for session {SessionId}. User: {User}", sessionId, backgroundUserId);

                if (sessionInfo == null || string.IsNullOrEmpty(sessionInfo.OriginalFileName))
                {
                    _logger.LogError("[PstService] Session {SessionId} not found or missing metadata. User: {User}", sessionId, licenseId);
                    return;
                }

                var itemName = $"{sessionInfo.OriginalFileName}{sessionInfo.Size}";

                // 1. Check Module Status
                var moduleStatus = await _licenseClient.GetModuleVersion(backgroundUserId);
                if (moduleStatus != ModuleLicenseType.Active)
                {
                    _logger.LogWarning("[PstService] License status {Status} for {User}. Aborting.", moduleStatus, backgroundUserId);
                    var sessionUpdateResult = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (sessionUpdateResult != null)
                    {
                        sessionUpdateResult.Status = "LicenseActiveRequired";
                        await scopedDb.SaveChangesAsync();
                    }
                    return;
                }

                // 2. Check License Item Status
                var itemStatus = await _licenseClient.GetItemStatus(backgroundUserId, itemName);
                _logger.LogInformation("[LICENSE] Item {Item} Status: {Status} (User: {User})", itemName, itemStatus, backgroundUserId);

                if (itemStatus == ItemStatus.Failed)
                {
                    _logger.LogWarning("[PstService] License check failed for {Item}. Aborting.", itemName);
                    var sessionUpdateResult = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (sessionUpdateResult != null)
                    {
                        sessionUpdateResult.Status = "LicenseCheckFailed";
                        await scopedDb.SaveChangesAsync();
                    }
                    return;
                }

                if (itemStatus == ItemStatus.Success)
                {
                    // Item increment is now handled by the license server's status check.
                    // We only need to handle storage updates here.

                    // Check if storage can be updated (within limits)
                    var storageUpdated = await _licenseClient.UpdateStorageAsync(backgroundUserId, sessionInfo.Size, itemName);
                    if (!storageUpdated)
                    {
                        _logger.LogWarning("[PstService] Storage limit reached for {User}. Cannot add {Size} bytes.", backgroundUserId, sessionInfo.Size);
                        var sessionUpdateResult = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                        if (sessionUpdateResult != null)
                        {
                            sessionUpdateResult.Status = "LimitReached";
                            await scopedDb.SaveChangesAsync();
                        }
                        return;
                    }
                }
                else
                {
                    // ItemStatus.Exist: Proceed without deduction (continue download/conversion)
                    _logger.LogInformation("[PstService] Item {Item} already exists on license server. Skipping deduction.", itemName);
                }

                // 3. Start Conversion Process (this is where "continue download" or "start conversion" happens)
                var storageTracker = new BatchStorageTracker(licenseId, _licenseClient, itemName);
                if (itemStatus == ItemStatus.Exist) storageTracker.IsEnabled = false; // Deducted upfront, disable incremental tracking

                // HYPER FAST PATH: Direct OST to PST conversion (Native implementation)
                if (!deduplicate && !excludeEmptyFolders && exportLimit == -1)
                {
                    try
                    {
                        token.ThrowIfCancellationRequested();
                        if (_logger.IsEnabled(LogLevel.Information))
                            _logger.LogInformation("[PstService] Using HYPER FAST PATH for session {SessionId}", sessionId);

                        using (var storage = PersonalStorage.FromFile(srcPath))
                        {
                            storage.SaveAs(outputPath, FileFormat.Pst);
                        }

                        token.ThrowIfCancellationRequested();
                        await storageTracker.FlushAsync();

                        if (sessionInfo != null)
                        {
                            sessionInfo.Status = "Ready (Native)";
                            sessionInfo.IsPaid = true;
                            await scopedDb.SaveChangesAsync();
                        }
                        return;
                    }
                    catch (OperationCanceledException) { return; }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("[PstService] Native ConvertOstToPst failed, falling back: {Message}", ex.Message);
                        if (File.Exists(outputPath)) TryDelete(outputPath);
                    }
                }

                if (File.Exists(outputPath)) TryDelete(outputPath);

                // For the direct merge (consolidation) fast path, MergeWith internally opens
                // the source file as writable, which conflicts with the pool's open handle.
                // We must release the pool handle first, then perform the merge directly.
                if (!deduplicate && !excludeEmptyFolders && exportLimit == -1)
                {
                    if (sessionInfo != null)
                    {
                        sessionInfo.Status = "Processing: Consolidating data...";
                        await scopedDb.SaveChangesAsync();
                    }

                    // Release the pool's open handle before MergeWith to avoid file lock conflict.
                    await _pool.RemoveAsync(sessionId);

                    using var destStorage = PersonalStorage.Create(outputPath, FileFormatVersion.Unicode);
                    destStorage.MergeWith([srcPath]);

                    if (splitSizeMb > 0)
                    {
                        var tempDir = Path.Combine(_uploadDir, $"split_{sessionId}");
                        if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
                        Directory.CreateDirectory(tempDir);
                        destStorage.SplitInto(splitSizeMb.Value * 1024 * 1024, tempDir);
                    }
                }
                else
                {
                    await _pool.AccessAsync(sessionId, srcPath, async srcStorage =>
                    {
                        using var destStorage = PersonalStorage.Create(outputPath, FileFormatVersion.Unicode);

                        var seenMessages = deduplicate ? new HashSet<string>() : null;
                        var folderCounts = excludeEmptyFolders ? new Dictionary<string, int>() : null;
                        if (excludeEmptyFolders) BuildFolderCountCache(srcStorage.RootFolder, folderCounts!);

                        var limitReached = false;
                        await CopyFolders(licenseId, srcStorage.RootFolder, destStorage.RootFolder, srcStorage, _licenseClient, excludeEmptyFolders, exportLimit, seenMessages, null, folderCounts, () => limitReached = true, _logger, storageTracker, token);

                        if (limitReached)
                        {
                            _logger.LogWarning("Conversion for session {SessionId} stopped early due to license limit.", sessionId);
                            if (sessionInfo != null)
                            {
                                sessionInfo.Status = "Partial: Limit Reached";
                                await scopedDb.SaveChangesAsync();
                            }
                        }

                        if (splitSizeMb > 0)
                        {
                            var tempDir = Path.Combine(_uploadDir, $"split_{sessionId}");
                            if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
                            Directory.CreateDirectory(tempDir);
                            destStorage.SplitInto(splitSizeMb.Value * 1024 * 1024, tempDir);
                        }

                        return true;
                    }, password);
                }

                List<string> splitFilenames = [];
                if (splitSizeMb > 0)
                {
                    var tempDir = Path.Combine(_uploadDir, $"split_{sessionId}");
                    if (Directory.Exists(tempDir))
                    {
                        var splitFiles = Directory.GetFiles(tempDir, "*.pst");
                        int partNum = 1;
                        foreach (var sf in splitFiles)
                        {
                            string newFilename = $"{baseName}_converted_part{partNum}{ext}";
                            string newPath = Path.Combine(_uploadDir, newFilename);
                            File.Move(sf, newPath, true);
                            splitFilenames.Add(newFilename);
                            partNum++;
                        }
                        Directory.Delete(tempDir, true);
                        TryDelete(outputPath); // Delete monolithic
                    }
                }

                var s = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (s != null && !token.IsCancellationRequested)
                {
                    s.Status = "Ready"; // Clearly mark as ready
                    s.IsPaid = true;    // Session conversion is paid for
                    if (splitFilenames.Count > 0)
                    {
                        s.SplitFilesJson = System.Text.Json.JsonSerializer.Serialize(splitFilenames);
                    }
                    await scopedDb.SaveChangesAsync();
                }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[CONVERT] Background conversion CANCELLED for {sessionId}");
                TryDelete(outputPath);
                var tempDir = Path.Combine(_uploadDir, $"split_{sessionId}");
                if (Directory.Exists(tempDir)) try { Directory.Delete(tempDir, true); } catch { }
            }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Background conversion failed for session {SessionId}. Error: {Message}. Stack: {Stack}", sessionId, ex.Message, ex.StackTrace);
                    var s = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s != null)
                    {
                        s.Status = ex.Message.Contains("License limit exceeded", StringComparison.OrdinalIgnoreCase)
                            ? "LimitReached"
                            : "ConversionFailed";
                        await scopedDb.SaveChangesAsync();
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
    /// <summary>
    /// Recursively copies folders and their contents from a source storage to a destination storage.
    /// </summary>
    private static async Task CopyFolders(string licenseId,
                                    FolderInfo source,
                                    FolderInfo destParent,
                                    PersonalStorage srcPst,
                                    LicenseApiClient licenseClient,
                                    bool excludeEmptyFolders,
                                    int limit,
                                    HashSet<string>? seenHashes,
                                    HashSet<string>? visitedFolders = null,
                                    Dictionary<string, int>? folderCounts = null,
                                    Action? onLimitReached = null,
                                    ILogger? logger = null,
                                    BatchStorageTracker? tracker = null,
                                    CancellationToken token = default)
    {
        var log = logger;
        visitedFolders ??= [];
        if (!visitedFolders.Add(source.EntryIdString)) return;

        IEnumerable<FolderInfo>? subFolders = null;
        try { subFolders = source.GetSubFolders(); }
        catch (Exception ex) { log?.LogWarning("Failed to get subfolders for {Path}: {Message}", source.DisplayName, ex.Message); }

        if (subFolders == null) return;

        foreach (var srcFolder in subFolders)
        {
            try
            {
                token.ThrowIfCancellationRequested();

                if (excludeEmptyFolders)
                {
                    int totalMessages = 0;
                    if (folderCounts != null && folderCounts.TryGetValue(srcFolder.EntryIdString, out int cachedCount))
                    {
                        totalMessages = cachedCount;
                    }
                    else
                    {
                        totalMessages = GetTotalMessageCount(srcFolder);
                    }
                    if (totalMessages == 0) continue;
                }

                // Track item usage for this folder (Removed: Now tracking file upload count instead)
                MessageInfoCollection? contents = null;
                try { contents = srcFolder.GetContents(); }
                catch (Exception ex) { log?.LogWarning("Failed to get contents for folder {Path}: {Message}", srcFolder.DisplayName, ex.Message); }

                if (contents == null) continue;

                var newFolder = destParent.AddSubFolder(srcFolder.DisplayName);

                int folderExportedCount = 0;
                foreach (var msgInfo in contents)
                {
                    token.ThrowIfCancellationRequested();
                    if (limit > -1 && folderExportedCount >= limit) break;

                    try
                    {
                        // Deduplication optimization
                        string? dedupKey = null;
                        if (seenHashes != null)
                        {
                            if (msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_INTERNET_MESSAGE_ID))
                            {
                                dedupKey = msgInfo.Properties[MapiPropertyTag.PR_INTERNET_MESSAGE_ID].GetString();
                            }

                            if (!string.IsNullOrEmpty(dedupKey) && !seenHashes.Add(dedupKey)) continue;
                        }

                        using var msg = srcPst.ExtractMessage(msgInfo.EntryIdString);

                        if (msg != null)
                        {
                            if (seenHashes != null && string.IsNullOrEmpty(dedupKey))
                            {
                                var messageId = msg.Headers["Message-ID"] ?? msg.Headers["Message-Id"];
                                dedupKey = !string.IsNullOrEmpty(messageId) ? messageId : $"{msg.Subject}_{msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_DELIVERY_TIME]?.GetDateTime()}";
                                if (!seenHashes.Add(dedupKey)) continue;
                            }

                            var msgSize = msg.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_SIZE)
                                ? msgInfo.Properties[MapiPropertyTag.PR_MESSAGE_SIZE].GetLong()
                                : 0;

                            if (tracker != null)
                            {
                                if (!await tracker.UpdateAsync(msgSize))
                                {
                                    onLimitReached?.Invoke();
                                    return;
                                }
                            }
                            /*
                            else if (!await licenseClient.UpdateStorageAsync(licenseId, msgSize))
                            {
                                onLimitReached?.Invoke();
                                return; // Stop recursion for this branch
                            }
                            */

                            newFolder.AddMessage(msg);
                            folderExportedCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        log?.LogWarning("Skipping corrupted message in folder {Path}: {Message}", srcFolder.DisplayName, ex.Message);
                        continue;
                    }
                }
                await CopyFolders(licenseId, srcFolder, newFolder, srcPst, licenseClient, excludeEmptyFolders, limit, seenHashes, visitedFolders, folderCounts, onLimitReached, log, tracker, token);
            }
            catch (OperationCanceledException) { throw; }
            catch (Exception ex)
            {
                log?.LogError(ex, "Failed to process folder {Path}", srcFolder.DisplayName);
                continue;
            }
        }
    }
    /// <summary>
    /// Builds a cache of message counts for all folders in the storage.
    /// </summary>
    private static int BuildFolderCountCache(FolderInfo folder, Dictionary<string, int> cache)
    {
        int count = folder.ContentCount;
        foreach (var sub in folder.GetSubFolders())
        {
            count += BuildFolderCountCache(sub, cache);
        }
        cache[folder.EntryIdString] = count;
        return count;
    }
    /// <summary>
    /// Calculates the total number of messages in a folder and all its subfolders.
    /// </summary>
    private static int GetTotalMessageCount(FolderInfo folder)
    {
        int count = folder.ContentCount;
        IEnumerable<FolderInfo>? subFolders = null;
        try { subFolders = folder.GetSubFolders(); }
        catch { }

        if (subFolders != null)
        {
            foreach (var sub in subFolders)
            {
                count += GetTotalMessageCount(sub);
            }
        }
        return count;
    }
    /// <summary>
    /// Retrieves a hierarchical tree structure of folders in a PST/OST file.
    /// </summary>
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
    /// <summary>
    /// Recursively builds a folder info tree from a starting folder.
    /// </summary>
    private static List<PstFolderInfo> BuildFolderTree(FolderInfo folder, bool excludeEmpty = false)
    {
        try
        {
            var result = new List<PstFolderInfo>();

            foreach (var sub in folder.GetSubFolders())
            {
                try
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
                catch (Exception)
                {
                    continue;
                }

            }
            return result;
        }
        catch (Exception)
        {
            return [];
        }
    }
    /// <summary>
    /// Flattens or cleans up the folder tree by removing non-essential root levels.
    /// </summary>
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
    /// <summary>
    /// Retrieves a list of message summaries from a specific folder.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the messages.</param>
    /// <param name="folderId">The unique ID of the folder to retrieve messages from.</param>
    /// <param name="filter">Optional date filter for messages.</param>
    /// <param name="sortBy">The field to sort by (e.g., "date", "subject").</param>
    /// <param name="sortOrder">The sort order ("asc" or "desc").</param>
    /// <returns>A list of message summaries.</returns>
    /// 
    public async Task<List<PstMessageSummary>> GetMessagesAsync(string sessionId, string userId, string folderId, MessageDateFilter? filter = null, string? sortBy = "date", string? sortOrder = "desc")
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstMessageSummary>());

            // LogDebug($"GetMessagesAsync: Folder '{folder.DisplayName}', ContentCount={folder.ContentCount}");
            var list = new List<PstMessageSummary>();
            MessageInfoCollection? contents = null;
            try { contents = folder.GetContents(); }
            catch (Exception ex) { _logger.LogWarning("Failed to get contents for folder {Path}: {Message}", folder.DisplayName, ex.Message); }

            if (contents == null) return Task.FromResult(list);

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
                    HasAttachments = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_HASATTACH) && msgInfo.Properties[MapiPropertyTag.PR_HASATTACH].GetBoolean(),
                    Body = msgInfo.Properties.ContainsKey(MapiPropertyTag.PR_BODY) ? msgInfo.Properties[MapiPropertyTag.PR_BODY].GetString() : ""
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
    /// <summary>
    /// Retrieves detailed information about a specific message.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the detail.</param>
    /// <param name="entryId">The unique ID of the message to retrieve.</param>
    /// <returns>A message detail object, or null if not found.</returns>
    public async Task<PstMessageDetail?> GetMessageDetailAsync(string sessionId, string userId, string entryId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {

            MapiMessage? msg = null;
            try { msg = pst.ExtractMessage(entryId); }
            catch (Exception ex) { _logger.LogWarning("Failed to extract message {EntryId}: {Message}", entryId, ex.Message); }

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
                BodyText = !string.IsNullOrEmpty(msg.Body) ? msg.Body : (msg.BodyHtml != null ? "" : "No content available"),
                Attachments = [.. msg.Attachments.Select(att => new AttachmentInfo {
                        FileName = att.LongFileName ?? att.DisplayName ?? "attachment",
                        Size = att.BinaryData?.Length ?? 0,
                        ContentType = att.MimeTag ?? "application/octet-stream"
                    })]
            });
        }, password);
    }

    /// <summary>
    /// Retrieves a list of contacts from a specific folder.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the contacts.</param>
    /// <param name="folderId">The unique ID of the folder.</param>
    /// <returns>A list of contact information objects.</returns>
    public async Task<List<PstContactInfo>> GetContactsAsync(string sessionId, string userId, string folderId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstContactInfo>());

            var list = new List<PstContactInfo>();
            MessageInfoCollection? contents = null;
            try { contents = folder.GetContents(); }
            catch (Exception ex) { _logger.LogWarning("Failed to get contents for contact folder {Path}: {Message}", folder.DisplayName, ex.Message); }

            if (contents == null) return Task.FromResult(list);

            foreach (var msgInfo in contents)
            {
                if (msgInfo.MessageClass != "IPM.Contact") continue;
                MapiMessage? msg = null;
                try { msg = pst.ExtractMessage(msgInfo.EntryIdString); }
                catch (Exception ex) { _logger.LogWarning("Failed to extract contact {EntryId}: {Message}", msgInfo.EntryIdString, ex.Message); }

                if (msg == null) continue;

                using (msg)
                {
                    var contact = (MapiContact)msg.ToMapiMessageItem();
                    list.Add(new PstContactInfo
                    {
                        EntryId = msgInfo.EntryIdString,
                        DisplayName = contact.NameInfo?.DisplayName ?? "",
                        Email = contact.ElectronicAddresses?.Email1?.EmailAddress ?? "",
                        Company = contact.ProfessionalInfo?.CompanyName ?? "",
                        Phone = contact.Telephones?.BusinessTelephoneNumber ?? ""
                    });
                }
            }
            return Task.FromResult(list);
        }, password);
    }

    /// <summary>
    /// Retrieves a list of calendar items from a specific folder.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the calendar items.</param>
    /// <param name="folderId">The unique ID of the folder.</param>
    /// <returns>A list of calendar information objects.</returns>
    public async Task<List<PstCalendarInfo>> GetCalendarItemsAsync(string sessionId, string userId, string folderId)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        return await _pool.AccessAsync(sessionId, filePath, pst =>
        {
            var folder = pst.GetFolderById(folderId);
            if (folder is null) return Task.FromResult(new List<PstCalendarInfo>());

            var list = new List<PstCalendarInfo>();
            MessageInfoCollection? contents = null;
            try { contents = folder.GetContents(); }
            catch (Exception ex) { _logger.LogWarning("Failed to get contents for calendar folder {Path}: {Message}", folder.DisplayName, ex.Message); }

            if (contents == null) return Task.FromResult(list);

            foreach (var msgInfo in contents)
            {
                if (msgInfo.MessageClass != "IPM.Appointment") continue;
                MapiMessage? msg = null;
                try { msg = pst.ExtractMessage(msgInfo.EntryIdString); }
                catch (Exception ex) { _logger.LogWarning("Failed to extract calendar item {EntryId}: {Message}", msgInfo.EntryIdString, ex.Message); }

                if (msg == null) continue;

                using (msg)
                {
                    var appt = (MapiCalendar)msg.ToMapiMessageItem();
                    list.Add(new PstCalendarInfo
                    {
                        EntryId = msgInfo.EntryIdString,
                        Subject = appt.Subject ?? "",
                        StartDate = appt.StartDate,
                        EndDate = appt.EndDate,
                        Location = appt.Location ?? ""
                    });
                }
            }
            return Task.FromResult(list);
        }, password);
    }

    /// <summary>
    /// Exports a single message to a specified format and writes it to an output stream.
    /// </summary>
    /// <param name="outputStream">The stream to write the exported message to.</param>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the export.</param>
    /// <param name="entryId">The unique ID of the message to export.</param>
    /// <param name="format">The target export format.</param>
    public async Task ExportMessageAsync(Stream outputStream, string sessionId, string userId, string entryId, ExportFormat format, string? userEmail = null)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        var licenseId = userEmail ?? userId;
        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null || string.IsNullOrEmpty(session.OriginalFileName)) throw new Exception("Session metadata missing");

        var itemName = $"{session.OriginalFileName}{session.Size}";
        var sessionSize = session.Size;

        var itemStatus = await _licenseClient.GetItemStatus(licenseId, itemName);
        if (itemStatus == ItemStatus.Failed) throw new Exception("License check failed");

        if (itemStatus == ItemStatus.Success)
        {

            await _licenseClient.UpdateStorageAsync(licenseId, sessionSize, itemName);
        }

        var storageTracker = new BatchStorageTracker(licenseId, _licenseClient, itemName);
        if (itemStatus == ItemStatus.Exist) storageTracker.IsEnabled = false;

        await _pool.AccessAsync(sessionId, filePath, async pst =>
        {
            var msg = pst.ExtractMessage(entryId) ?? throw new FileNotFoundException("Message not found");

            var msgSize = msg.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_SIZE) ? msg.Properties[MapiPropertyTag.PR_MESSAGE_SIZE].GetLong() : 0;
            if (msgSize > 0) await storageTracker.UpdateAsync(msgSize);

            SaveMessageToStream(msg, outputStream, format);
            await storageTracker.FlushAsync();
            return true;
        }, password);
    }

    /// <summary>
    /// Exports all messages in a specific folder to a ZIP archive in the specified format.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the export.</param>
    /// <param name="folderId">The unique ID of the folder to export.</param>
    /// <param name="format">The target export format for individual messages.</param>
    /// <param name="filter">Optional date filter for messages.</param>
    /// <returns>The local path to the generated ZIP archive.</returns>
    public async Task<string> ExportFolderAsync(string sessionId, string userId, string folderId, ExportFormat format, MessageDateFilter? filter = null, string? userEmail = null)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);
        var licenseId = userEmail ?? userId;
        var tempZipPath = Path.Combine(_uploadDir, $"export_{sessionId}_{Guid.NewGuid():N}.zip");

        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null || string.IsNullOrEmpty(session.OriginalFileName)) throw new Exception("Session metadata missing");

        var itemName = $"{session.OriginalFileName}{session.Size}";
        var sessionSize = session.Size;

        var itemStatus = await _licenseClient.GetItemStatus(licenseId, itemName);
        if (itemStatus == ItemStatus.Failed) throw new Exception("License check failed");

        if (itemStatus == ItemStatus.Success)
        {
            await _licenseClient.UpdateStorageAsync(licenseId, sessionSize, itemName);
        }

        var storageTracker = new BatchStorageTracker(licenseId, _licenseClient, itemName);
        if (itemStatus == ItemStatus.Exist) storageTracker.IsEnabled = false;

        await _pool.AccessAsync(sessionId, filePath, async pst =>
        {
            var folder = pst.GetFolderById(folderId) ?? throw new FileNotFoundException("Folder not found");
            using (var fs = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write, FileShare.None, 1024 * 1024))
            using (var archive = new ZipArchive(fs, ZipArchiveMode.Create, true))
            {
                var archiveLock = new object();
                await ExportFolderRecursive(licenseId, pst, folder, "", format, archive, archiveLock, filter, false, -1, CancellationToken.None, storageTracker);
                await storageTracker.FlushAsync();
            }
            return true;
        }, password);
        return tempZipPath;
    }
    /// <summary>
    /// Exports multiple items (entire store, specific folder, or selected messages) to a ZIP archive.
    /// </summary>
    /// <param name="sessionId">The session ID of the PST/OST file.</param>
    /// <param name="userId">The ID of the user requesting the export.</param>
    /// <param name="format">The target export format.</param>
    /// <param name="folderId">Optional ID of a specific folder to export.</param>
    /// <param name="entryIds">Optional list of specific message IDs to export.</param>
    /// <param name="filter">Optional date filter for messages.</param>
    /// <param name="excludeEmptyFolders">Whether to exclude empty folders in the ZIP structure.</param>
    /// <param name="userEmail">Optional email of the user.</param>
    /// <param name="isDemo">Whether the user is on a demo license.</param>
    /// <param name="moduleLicenseType">The type of license for the module.</param>
    /// <returns>A tuple containing the generated ZIP path and whether it's ready.</returns>    
    public async Task<(string FilePath, bool isReady)> ExportAllAsync(string sessionId,
                                                                      string userId,
                                                                      ExportFormat format,
                                                                       bool isDemo,
                                                                       string? folderId = null,
                                                                      List<string>? entryIds = null,
                                                                      MessageDateFilter? filter = null,
                                                                      bool excludeEmptyFolders = false,
                                                                      string? userEmail = null)
    {
        var (filePath, password) = await GetSessionDataAsync(sessionId, userId);


        int exportLimit = -1;
        if (isDemo)
        {
            exportLimit = AllConstants.DemoExportLimit;
        }

        if (exportLimit > -1 && entryIds != null && entryIds.Count > exportLimit)
        {
            throw new InvalidOperationException($"Selection limit exceeded. Your license allows exporting up to {exportLimit} items. Please upgrade to a Professional plan.");
        }
        //--------------------------------------------------

        string suffix = "";
        if (!string.IsNullOrEmpty(folderId)) suffix += $"_f_{GetStableHash(folderId)}";
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
        if (exportLimit > -1)
        {
            suffix += $"_lmt_{exportLimit}";
        }

        var tempZipPath = Path.Combine(_uploadDir, $"export_{sessionId}_{format}{suffix}_{excludeEmptyFolders}.zip");

        var session = await _db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);

        // Per-task status check
        string exportingStatus = $"Exporting{suffix}";
        string readyStatus = $"Ready{suffix}";

        bool isFinished = session != null && session.Status == readyStatus;

        if (session != null && session.Status == exportingStatus)
        {
            // LogDebug($"ExportAllAsync: Task for {suffix} is currently exporting.");
            return (tempZipPath, false);
        }

        if (File.Exists(tempZipPath) && (isFinished || (session != null && session.Status.StartsWith("Ready"))))
        {
            // LogDebug($"ExportAllAsync: Task for {suffix} is already ready.");
            return (tempZipPath, true);
        }

        if (session != null)
        {
            // LogDebug($"ExportAllAsync: Starting new export task for {suffix}. Setting status to {exportingStatus}");
            session.Status = exportingStatus;
            await _db.SaveChangesAsync();
        }

        // IMPROVEMENT: Cancel existing export to save CPU/IO
        if (_conversionCts.TryRemove(sessionId, out var existingExportCts))
        {
            try { existingExportCts.Cancel(); existingExportCts.Dispose(); } catch { }
        }

        var cts = new CancellationTokenSource();
        _conversionCts[sessionId] = cts;
        var token = cts.Token;

        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            try
            {
                var licenseId = userEmail ?? userId ?? _config["LicenseApi:UserId"] ?? "unauthenticated";

                var sessionMetadata = await scopedDb.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (sessionMetadata == null)
                {
                    await Task.Delay(500);
                    sessionMetadata = await scopedDb.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                }

                if (sessionMetadata == null || string.IsNullOrEmpty(sessionMetadata.OriginalFileName))
                {
                    _logger.LogError("[PstService] Session {SessionId} not found in background task.", sessionId);
                    return;
                }

                var itemName = $"{sessionMetadata.OriginalFileName}{sessionMetadata.Size}";
                var itemStatus = await _licenseClient.GetItemStatus(licenseId, itemName);

                if (itemStatus == ItemStatus.Failed) return;

                if (itemStatus == ItemStatus.Success)
                {
                    await _licenseClient.UpdateStorageAsync(licenseId, sessionMetadata.Size, itemName);
                }

                var storageTracker = new BatchStorageTracker(licenseId, _licenseClient, itemName);
                if (itemStatus == ItemStatus.Exist) storageTracker.IsEnabled = false;

                await _pool.AccessAsync(sessionId, filePath, async pst =>
                {
                    using (var fs = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write, FileShare.None, 4 * 1024 * 1024))
                    using (var archive = new System.IO.Compression.ZipArchive(fs, ZipArchiveMode.Create, true))
                    {
                        int index = 0;

                        if (entryIds != null && entryIds.Count > 0)
                        {
                            var semaphore = new SemaphoreSlim(8);
                            var archiveLock = new object();
                            var exportTasks = new List<Task>();
                            var limitReached = false;
                            using var limitCts = CancellationTokenSource.CreateLinkedTokenSource(token);

                            try
                            {
                                foreach (var entryId in entryIds)
                                {
                                    if (limitReached) break;
                                    limitCts.Token.ThrowIfCancellationRequested();
                                    await semaphore.WaitAsync(limitCts.Token);

                                    exportTasks.Add(Task.Run(async () =>
                                    {
                                        try
                                        {
                                            MapiMessage? msg = null;
                                            lock (pst)
                                            {
                                                try { msg = pst.ExtractMessage(entryId); }
                                                catch (Exception ex) { _logger.LogWarning("Failed to extract message {EntryId}: {Message}", entryId, ex.Message); }
                                            }

                                            if (msg == null) return;

                                            using (msg)
                                            {
                                                Interlocked.Increment(ref index);
                                                var currentMsgIndex = index;
                                                var msgSize = msg.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_SIZE)
                                                    ? msg.Properties[MapiPropertyTag.PR_MESSAGE_SIZE].GetLong()
                                                    : 0;

                                                if (storageTracker != null)
                                                {
                                                    if (!await storageTracker.UpdateAsync(msgSize))
                                                    {
                                                        limitReached = true;
                                                        limitCts.Cancel();
                                                        return;
                                                    }
                                                }

                                                var ext = GetFileExtension(format);
                                                var sanitizedSubject = SanitizeFileName(msg.Subject ?? $"msg_{currentMsgIndex}");
                                                var entryPath = $"{sanitizedSubject}_{currentMsgIndex}{ext}";

                                                lock (archiveLock)
                                                {
                                                    var entry = archive.CreateEntry(entryPath, CompressionLevel.NoCompression);
                                                    using var es = entry.Open();
                                                    SaveMessageToStream(msg, es, format);
                                                }
                                            }
                                        }
                                        catch (OperationCanceledException) { }
                                        catch (Exception ex)
                                        {
                                            _logger.LogError(ex, "Failed to process message {EntryId}", entryId);
                                        }
                                        finally
                                        {
                                            semaphore.Release();
                                        }
                                    }, limitCts.Token));
                                }
                                await Task.WhenAll(exportTasks).ContinueWith(_ => { });
                            }
                            finally
                            {
                                if (limitReached)
                                {
                                    _logger.LogWarning("Export for session {SessionId} stopped early due to license limit.", sessionId);
                                    var s = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                                    if (s != null) s.Status = "Partial: Limit Reached";
                                }
                            }
                        }
                        else
                        {
                            var root = string.IsNullOrEmpty(folderId) ? pst.RootFolder : pst.GetFolderById(folderId);
                            if (root != null)
                            {
                                var archiveLock = new object();
                                await ExportFolderRecursive(licenseId, pst, root, "", format, archive, archiveLock, filter, excludeEmptyFolders, exportLimit, token, storageTracker);
                            }
                        }
                        await storageTracker.FlushAsync();
                    }
                    return true;
                }, password);

                var s2 = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                if (s2 != null && !token.IsCancellationRequested)
                {
                    s2.Status = readyStatus;
                    s2.IsPaid = true;
                    await scopedDb.SaveChangesAsync();
                }
            }
            catch (OperationCanceledException) { TryDelete(tempZipPath); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background export failed for session {SessionId}: {Message}", sessionId, ex.Message);
                if (!token.IsCancellationRequested)
                {
                    var s3 = await scopedDb.ConversionSessions.FirstOrDefaultAsync(x => x.SessionId == sessionId);
                    if (s3 != null)
                    {
                        s3.Status = ex.Message.Contains("License limit exceeded", StringComparison.OrdinalIgnoreCase)
                            ? "LimitReached"
                            : "ExportFailed";
                        await scopedDb.SaveChangesAsync();
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
    /// <summary>
    /// Recursively exports folder contents and subfolders into a ZIP archive.
    /// </summary>
    private async Task ExportFolderRecursive(string licenseId, PersonalStorage pst, FolderInfo folder, string path, ExportFormat format, ZipArchive archive, object archiveLock, MessageDateFilter? filter, bool excludeEmpty, int limit, CancellationToken token, BatchStorageTracker? tracker = null)
    {
        var internalTracker = tracker ?? new BatchStorageTracker(licenseId, _licenseClient);
        var limitReached = false;
        await ExportFolderRecursiveInternal(licenseId, pst, folder, path, format, archive, archiveLock, filter, excludeEmpty, limit, () => limitReached = true, token, internalTracker);

        // Only flush if we created the tracker locally
        if (tracker == null) await internalTracker.FlushAsync();

        if (limitReached)
        {
            _logger.LogWarning("Recursive export hit license limit at folder: {Path}", path);
        }
    }

    private async Task ExportFolderRecursiveInternal(string licenseId, PersonalStorage pst, FolderInfo folder, string path, ExportFormat format, ZipArchive archive, object archiveLock, MessageDateFilter? filter, bool excludeEmpty, int limit, Action onLimitHit, CancellationToken token, BatchStorageTracker? tracker = null)
    {
        token.ThrowIfCancellationRequested();

        // High-performance filtering using Aspose.Email query engine
        Aspose.Email.Tools.Search.MailQuery? mailQuery = BuildQuery(filter);
        MessageInfoCollection? contents = null;
        try
        {
            contents = mailQuery != null ? folder.GetContents(mailQuery) : folder.GetContents();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to get contents for folder {Path} during recursive export: {Message}. Skipping folder messages.", path, ex.Message);
        }

        if (contents == null || (excludeEmpty && contents.Count == 0))
        {
            if (excludeEmpty)
            {
                bool hasMatchingSubfolder = false;
                foreach (var sub in folder.GetSubFolders())
                {
                    if (HasMatchingContentRecursive(sub, mailQuery))
                    {
                        hasMatchingSubfolder = true;
                        break;
                    }
                }
                if (!hasMatchingSubfolder) return;
            }
            else if (contents == null)
            {
                // If it's not excludeEmpty but contents failed to load, we still want to try subfolders
                // but we should probably still create the folder entry if path is set.
            }
        }

        if (!string.IsNullOrEmpty(path)) archive.CreateEntry(path + "/");

        // REMOVED upfront folder scan that caused double-counting and performance loss

        int folderExportedCount = 0;
        var semaphore = new SemaphoreSlim(8);
        var exportTasks = new List<Task>();
        using var limitCts = CancellationTokenSource.CreateLinkedTokenSource(token);
        var limitHitLocal = false;

        try
        {
            if (contents != null)
            {
                foreach (var msgInfo in contents)
                {
                    if (limitHitLocal) break;
                    limitCts.Token.ThrowIfCancellationRequested();
                    if (limit > -1 && folderExportedCount >= limit) break;

                    folderExportedCount++;
                    var currentExportCount = folderExportedCount;
                    await semaphore.WaitAsync(limitCts.Token);

                    exportTasks.Add(Task.Run(async () =>
                    {
                        try
                        {
                            MapiMessage? msg = null;
                            lock (pst)
                            {
                                try { msg = pst.ExtractMessage(msgInfo.EntryIdString); }
                                catch (Exception ex) { _logger.LogWarning("Failed to extract message {EntryId}: {Message}", msgInfo.EntryIdString, ex.Message); }
                            }

                            if (msg == null) return;

                            using (msg)
                            {
                                var msgSize = msg.Properties.ContainsKey(MapiPropertyTag.PR_MESSAGE_SIZE)
                                    ? msg.Properties[MapiPropertyTag.PR_MESSAGE_SIZE].GetLong()
                                    : 0;

                                // Strict validation: Terminate gracefully if limit hit
                                if (tracker != null)
                                {
                                    if (!await tracker.UpdateAsync(msgSize))
                                    {
                                        limitHitLocal = true;
                                        onLimitHit();
                                        limitCts.Cancel();
                                        return;
                                    }
                                }
                                // else if (!await _licenseClient.UpdateStorageAsync(licenseId, msgSize))
                                // {
                                //     limitHitLocal = true;
                                //     onLimitHit();
                                //     limitCts.Cancel();
                                //     return;
                                // }

                                var entryName = string.IsNullOrEmpty(path)
                                    ? $"{SanitizeFileName(msg.Subject ?? "msg")}_{currentExportCount}{GetFileExtension(format)}"
                                    : $"{path}/{SanitizeFileName(msg.Subject ?? "msg")}_{currentExportCount}{GetFileExtension(format)}";

                                lock (archiveLock)
                                {
                                    var entry = archive.CreateEntry(entryName, CompressionLevel.NoCompression);
                                    using var es = entry.Open();
                                    SaveMessageToStream(msg, es, format);
                                }
                            }
                        }
                        catch (OperationCanceledException) { }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process message {EntryId}", msgInfo.EntryIdString);
                        }
                        finally
                        {
                            semaphore.Release();
                        }
                    }, limitCts.Token));
                }
            }
        }

        finally
        {
            await Task.WhenAll(exportTasks).ContinueWith(_ => { });
        }

        if (limitHitLocal) return;

        foreach (var sub in folder.GetSubFolders())
        {
            await ExportFolderRecursiveInternal(licenseId, pst, sub, string.IsNullOrEmpty(path) ? sub.DisplayName : $"{path}/{sub.DisplayName}", format, archive, archiveLock, filter, excludeEmpty, limit, onLimitHit, token, tracker);
        }
    }
    /// <summary>
    /// Builds an Aspose.Email MailQuery based on the provided date filter.
    /// </summary>
    private static Aspose.Email.Tools.Search.MailQuery? BuildQuery(MessageDateFilter? filter)
    {
        if (filter == null || filter.IsEmpty()) return null;

        var builder = new Aspose.Email.Storage.Pst.PersonalStorageQueryBuilder();

        if (filter.StartDate.HasValue)
            builder.InternalDate.Since(filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            builder.InternalDate.BeforeOrEqual(filter.EndDate.Value);

        if (filter.Year.HasValue)
        {
            var startOfYear = new DateTime(filter.Year.Value, 1, 1);
            var endOfYear = new DateTime(filter.Year.Value, 12, 31, 23, 59, 59);
            builder.InternalDate.Since(startOfYear);
            builder.InternalDate.BeforeOrEqual(endOfYear);
        }

        if (filter.Month.HasValue)
        {
            int year = filter.Year ?? DateTime.Now.Year;
            var startOfMonth = new DateTime(year, filter.Month.Value, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddSeconds(-1);
            builder.InternalDate.Since(startOfMonth);
            builder.InternalDate.BeforeOrEqual(endOfMonth);
        }

        return builder.GetQuery();
    }
    /// <summary>
    /// Recursively checks if a folder or its subfolders contain any messages matching the query.
    /// </summary>
    private static bool HasMatchingContentRecursive(FolderInfo folder, Aspose.Email.Tools.Search.MailQuery? query)
    {
        if (query != null)
        {
            try { if (folder.GetContents(query).Count > 0) return true; }
            catch { }
        }
        else
        {
            if (folder.ContentCount > 0) return true;
        }

        foreach (var sub in folder.GetSubFolders())
        {
            if (HasMatchingContentRecursive(sub, query)) return true;
        }
        return false;
    }

    /// <summary>
    /// Cleans up all local files and resources associated with a session.
    /// </summary>
    /// <param name="sessionId">The session ID to clean up.</param>
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
    /// <summary>
    /// Cancels any active background conversion or export tasks for a session.
    /// </summary>
    /// <param name="sessionId">The session ID to cancel tasks for.</param>
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
    /// <summary>
    /// Saves a MapiMessage to a stream in the specified export format.
    /// </summary>
    private static void SaveMessageToStream(MapiMessage msg, Stream stream, ExportFormat format)
    {
        using var ms = new MemoryStream();
        try
        {
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
                    using (var mailMsg = msg.ToMailMessage(new MailConversionOptions()))
                    {
                        var htmlOptions = new Aspose.Email.HtmlSaveOptions
                        {
                            HtmlFormatOptions = Aspose.Email.HtmlFormatOptions.WriteHeader | Aspose.Email.HtmlFormatOptions.WriteCompleteEmailAddress
                        };
                        mailMsg.Save(ms, htmlOptions);
                    }
                    break;
                case ExportFormat.Pdf:
                case ExportFormat.Doc:
                case ExportFormat.Docx:
                case ExportFormat.Rtf:
                case ExportFormat.Txt:
                    using (var mailMsg = msg.ToMailMessage(new MailConversionOptions()))
                    {
                        // Ensure international characters are preserved by setting UTF-8 encoding
                        mailMsg.BodyEncoding = Encoding.UTF8;
                        mailMsg.SubjectEncoding = Encoding.UTF8;

                        mailMsg.Save(ms, Aspose.Email.SaveOptions.DefaultMhtml);
                        ms.Position = 0;

                        var doc = new Aspose.Words.Document(ms)
                        {
                            FontSettings = Aspose.Words.Fonts.FontSettings.DefaultInstance
                        };

                        var wordsSaveFormat = format switch
                        {
                            ExportFormat.Pdf => Aspose.Words.SaveFormat.Pdf,
                            ExportFormat.Doc => Aspose.Words.SaveFormat.Doc,
                            ExportFormat.Docx => Aspose.Words.SaveFormat.Docx,
                            ExportFormat.Rtf => Aspose.Words.SaveFormat.Rtf,
                            ExportFormat.Txt => Aspose.Words.SaveFormat.Text,
                            _ => Aspose.Words.SaveFormat.Pdf
                        };
                        doc.Save(stream, wordsSaveFormat);
                        return; // Already copied to stream via doc.Save
                    }
                case ExportFormat.Vcf:
                    {
                        var item = msg.ToMapiMessageItem();
                        if (item is MapiContact contact)
                        {
                            contact.Save(ms, ContactSaveFormat.VCard);
                        }
                        else
                        {
                            // LogDebug("VCF Export: Message is not a contact, skipping.");
                        }
                    }
                    break;
                case ExportFormat.Ics:
                    {
                        var item = msg.ToMapiMessageItem();
                        if (item is MapiCalendar calendar)
                        {
                            calendar.Save(ms, AppointmentSaveFormat.Ics);
                        }
                        else
                        {
                            // LogDebug("ICS Export: Message is not a calendar item, skipping.");
                        }
                    }
                    break;
                case ExportFormat.Emlx:
                    msg.Save(ms, Aspose.Email.SaveOptions.DefaultEmlx);
                    break;
                case ExportFormat.Csv:
                case ExportFormat.Xml:
                case ExportFormat.Json:
                    {
                        var metadata = new
                        {
                            msg.Subject,
                            From = msg.SenderEmailAddress,
                            To = msg.DisplayTo,
                            Cc = msg.DisplayCc,
                            Date = msg.DeliveryTime,
                            msg.Body
                        };
                        if (format == ExportFormat.Json)
                        {
                            JsonSerializer.Serialize(ms, metadata, _jsonOptions);
                        }
                        else if (format == ExportFormat.Xml)
                        {
                            var xmlSerializer = new System.Xml.Serialization.XmlSerializer(metadata.GetType());
                            xmlSerializer.Serialize(ms, metadata);
                        }
                        else // CSV
                        {
                            using var writer = new StreamWriter(ms, leaveOpen: true);
                            writer.WriteLine("Subject,From,To,Cc,Date,Body");
                            writer.WriteLine($"\"{metadata.Subject?.Replace("\"", "\"\"")}\",\"{metadata.From?.Replace("\"", "\"\"")}\",\"{metadata.To?.Replace("\"", "\"\"")}\",\"{metadata.Cc?.Replace("\"", "\"\"")}\",\"{metadata.Date}\",\"{metadata.Body?.Replace("\"", "\"\"")}\"");
                        }
                    }
                    break;
                case ExportFormat.Mhtml:
                    msg.Save(ms, Aspose.Email.SaveOptions.DefaultMhtml);
                    break;
                case ExportFormat.Mbox:
                    using (var mailMsg = msg.ToMailMessage(new MailConversionOptions()))
                    using (var writer = new Aspose.Email.Storage.Mbox.MboxrdStorageWriter(ms, new Aspose.Email.Storage.Mbox.MboxSaveOptions { LeaveOpen = true }))
                    {
                        writer.WriteMessage(mailMsg);
                    }
                    break;
                default:
                    // Fallback to MHTML for unknown formats or throw if truly unsupported
                    msg.Save(ms, Aspose.Email.SaveOptions.DefaultMhtml);
                    break;
            }

            if (ms.Length > 0)
            {
                ms.Position = 0;
                ms.CopyTo(stream);
            }
        }
        catch (Exception)
        {
            // LogDebug($"SaveMessageToStream: Error during {format} export: {ex.Message}");
            throw;
        }
    }
    /// <summary>
    /// Returns the standard file extension for a given export format.
    /// </summary>
    private static string GetFileExtension(ExportFormat format) => format switch
    {
        ExportFormat.Eml => ".eml",
        ExportFormat.Msg => ".msg",
        ExportFormat.Html => ".html",
        ExportFormat.Mhtml => ".mhtml",
        ExportFormat.Mbox => ".mbox",
        ExportFormat.Oft => ".oft",
        ExportFormat.Olm => ".olm",
        ExportFormat.Emlx => ".emlx",
        ExportFormat.Doc => ".doc",
        ExportFormat.Docx => ".docx",
        ExportFormat.Txt => ".txt",
        ExportFormat.Rtf => ".rtf",
        ExportFormat.Csv => ".csv",
        ExportFormat.Xml => ".xml",
        ExportFormat.Json => ".json",
        ExportFormat.Vcf => ".vcf",
        ExportFormat.Ics => ".ics",
        ExportFormat.Pdf => ".pdf",
        _ => ".eml"
    };
    /// <summary>
    /// Sanitizes a string to be used as a safe filename.
    /// </summary>
    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string([.. name.Where(c => !invalid.Contains(c))]);
        return string.IsNullOrWhiteSpace(sanitized) ? "message" : sanitized.Trim();
    }
    /// <summary>
    /// Generates a stable, short SHA256 hash of the input string.
    /// </summary>
    private static string GetStableHash(string input)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant()[..8];
    }
    /// <summary>
    /// Attempts to delete a file, with retries if the file is locked.
    /// </summary>
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
    /// <summary>
    /// Helper class to batch storage updates to the license client during heavy processing.
    /// </summary>
    private class BatchStorageTracker(string licenseId, LicenseApiClient client, string? itemName = null)
    {
        private readonly string _licenseId = licenseId;
        private readonly LicenseApiClient _client = client;
        private readonly string? _itemName = itemName;

        public long PendingSize { get; private set; }
        public int PendingCount { get; private set; }
        public bool IsEnabled { get; set; } = true;

        public async Task<bool> UpdateAsync(long size)
        {
            if (!IsEnabled || size <= 0) return true;
            PendingSize += size;
            PendingCount++;

            // Batch every 100 messages or 10MB to balance performance and strictness
            if (PendingCount >= 100 || PendingSize >= 10 * 1024 * 1024)
            {
                return await FlushAsync();
            }
            return true;
        }

        public async Task<bool> FlushAsync()
        {
            if (!IsEnabled || PendingSize <= 0) return true;
            bool success = await _client.UpdateStorageAsync(_licenseId, PendingSize, _itemName);
            if (success)
            {
                PendingSize = 0;
                PendingCount = 0;
            }
            return success;
        }
    }
}
