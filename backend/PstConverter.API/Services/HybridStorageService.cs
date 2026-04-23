using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PstConverter.Services;

public interface IHybridStorageService
{
    // Upload flow (Initially to R2)
    Task<string> GetPresignedUploadUrlAsync(string key, string contentType);
    Task UploadToR2Async(string key, Stream stream, string contentType);

    // Finalization (Sync R2 object to Local VM storage)
    Task SyncR2ToLocalAsync(string key);

    // Operations (Cloud + Local)
    Task DeleteFromBothAsync(string key);

    // Helper to get local path for Aspose processing
    string GetLocalPath(string key);
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
        // Ensure the key doesn't have directory traversal or unwanted paths
        var fileName = Path.GetFileName(key);
        return Path.Combine(_uploadDir, fileName);
    }
}


