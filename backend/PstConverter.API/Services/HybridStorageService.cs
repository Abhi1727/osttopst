using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PstConverter.Services;

public interface IHybridStorageService
{
    // Upload flow (Initially to R2)
    Task<string> GetPresignedUploadUrlAsync(string key, string contentType);
    // Task UploadToR2Async(string key, Stream stream, string contentType);

    // Finalization (Sync R2 object to Local VM storage)
    Task SyncR2ToLocalAsync(string key);

    // Operations (Cloud + Local)
    Task DeleteFromBothAsync(string key);

    // Helper to get local path for Aspose processing
    string GetLocalPath(string key);

    // Upload local file back to R2
    Task SyncLocalToR2Async(string localPath, string key, string contentType);

    // Get download URL
    Task<string> GetPresignedDownloadUrlAsync(string key, int expiresInMinutes = 60);

    // Ensure file exists locally (download from R2 if missing)
    Task<string> EnsureLocalAsync(string key);
}



public class HybridStorageService : IHybridStorageService
{
    private readonly IStorageProvider _r2;
    private readonly ILogger<HybridStorageService> _logger;
    private readonly string _uploadDir;

    public HybridStorageService(
        R2StorageProvider r2, 
        ILogger<HybridStorageService> logger)
    {
        _r2 = r2;
        _logger = logger;
        _uploadDir = PstConverter.Data.StorageConstants.UploadDir;
        if (!Directory.Exists(_uploadDir)) Directory.CreateDirectory(_uploadDir);
    }

    public async Task<string> GetPresignedUploadUrlAsync(string key, string contentType)
    {
        _logger.LogInformation("[Storage] Generating presigned upload URL for R2: {Key}", key);
        return await _r2.GetUploadUrlAsync(key, contentType);
    }

    public async Task UploadToR2Async(string key, Stream stream, string contentType)
    {
        _logger.LogInformation("[Storage] Uploading to R2: {Key}", key);
        await _r2.UploadFileAsync(key, stream, contentType);
    }

    public async Task SyncR2ToLocalAsync(string key)
    {
        _logger.LogInformation("[Storage] Syncing R2 to Local VM: {Key}", key);
        var localPath = GetLocalPath(key);
        
        using var remoteStream = await _r2.DownloadFileAsync(key);
        using var localStream = new FileStream(localPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await remoteStream.CopyToAsync(localStream);
        
        _logger.LogInformation("[Storage] Successfully synced {Key} to {LocalPath}", key, localPath);
    }

    public async Task DeleteFromBothAsync(string key)
    {
        _logger.LogInformation("[Storage] Deleting from both: {Key}", key);
        
        // 1. Delete from R2
        try { await _r2.DeleteFileAsync(key); } 
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete from R2: {Key}", key); }
        
        // 2. Delete from Local
        var localPath = GetLocalPath(key);
        if (File.Exists(localPath))
        {
            try { File.Delete(localPath); } 
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete from Local: {LocalPath}", localPath); }
        }
    }


    public string GetLocalPath(string key)
    {
        // For keys like "osttopst/upload/user@email.com/sessionId/file.ost"
        // We extract the sessionId part to keep the local file unique.
        var parts = key.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 4)
        {
            // The structure is osttopst / upload (or download) / email / sessionId / fileName
            var sessionId = parts[3];
            var fileName = parts[^1];
            return Path.Combine(_uploadDir, $"{sessionId}_{fileName}");
        }

        // Fallback for older flat keys
        var fallbackFileName = Path.GetFileName(key);
        return Path.Combine(_uploadDir, fallbackFileName);
    }
     
    public async Task SyncLocalToR2Async(string localPath, string key, string contentType)
    {
        _logger.LogInformation("[Storage] Syncing Local to R2: {LocalPath} -> {Key}", localPath, key);
        
        if (!File.Exists(localPath))
        {
            _logger.LogError("[Storage] Local file not found for sync to R2: {LocalPath}", localPath);
            throw new FileNotFoundException("Local file not found", localPath);
        }

        var fileInfo = new FileInfo(localPath);
        var sizeInBytes = fileInfo.Length;
        _logger.LogInformation("[Storage] Syncing Local to R2: {LocalPath} ({Size} bytes) -> {Key}", localPath, sizeInBytes, key);

        using (var fileStream = new FileStream(localPath, FileMode.Open, FileAccess.Read, FileShare.Read))
        {
            await _r2.UploadFileAsync(key, fileStream, contentType);
        }
        
        _logger.LogInformation("[Storage] Successfully synced {LocalPath} to R2 key {Key}", localPath, key);
    }

    public async Task<string> GetPresignedDownloadUrlAsync(string key, int expiresInMinutes = 60)
    {
        _logger.LogInformation("[Storage] Generating presigned download URL for R2: {Key}", key);
        return await _r2.GetDownloadUrlAsync(key, expiresInMinutes);
    }

    public async Task<string> EnsureLocalAsync(string key)
    {
        var localPath = GetLocalPath(key);
        if (File.Exists(localPath))
        {
            return localPath;
        }

        _logger.LogInformation("[Storage] Local file missing, syncing from R2: {Key}", key);
        await SyncR2ToLocalAsync(key);
        
        if (!File.Exists(localPath))
        {
            throw new FileNotFoundException($"Failed to sync file from R2 to local storage. Key: {key}", localPath);
        }

        return localPath;
    }
}


