using Imagekit.Sdk;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace PstConverter.Services;

public class ImageKitService : IImageKitService
{
    private readonly ImagekitClient _imageKitClient;
    private readonly ILogger<ImageKitService> _logger;

    public ImageKitService(IConfiguration configuration, ILogger<ImageKitService> logger)
    {
        _logger = logger;
        var publicKey = configuration["ImageKit:PublicKey"];
        var privateKey = configuration["ImageKit:PrivateKey"];
        var urlEndpoint = configuration["ImageKit:UrlEndpoint"];

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey) || string.IsNullOrEmpty(urlEndpoint))
        {
            _logger.LogWarning("ImageKit configuration is missing. Uploads will fail.");
        }

        _imageKitClient = new ImagekitClient(publicKey, privateKey, urlEndpoint);
    }

    public async Task<string?> UploadImageAsync(IFormFile file, string fileName)
    {
        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var bytes = ms.ToArray();

            var uploadRequest = new FileCreateRequest
            {
                file = bytes,
                fileName = fileName,
                folder = "/blogs",
                useUniqueFileName = true
            };

            var result = await _imageKitClient.UploadAsync(uploadRequest);
            _logger.LogInformation("Successfully uploaded image to ImageKit: {Url}", result.url);
            return result.url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image to ImageKit: {FileName}", fileName);
            return null;
        }
    }

    public async Task<string?> UploadImageAsync(byte[] bytes, string fileName)
    {
        try
        {
            var uploadRequest = new FileCreateRequest
            {
                file = bytes,
                fileName = fileName,
                folder = "/blogs",
                useUniqueFileName = true
            };

            var result = await _imageKitClient.UploadAsync(uploadRequest);
            _logger.LogInformation("Successfully uploaded image bytes to ImageKit: {Url}", result.url);
            return result.url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image bytes to ImageKit: {FileName}", fileName);
            return null;
        }
    }

    public async Task<bool> DeleteImageAsync(string fileId)
    {
        try
        {
            if (string.IsNullOrEmpty(fileId)) return false;
            
            // ImageKit SDK DeleteFileAsync might expect the fileId
            await _imageKitClient.DeleteFileAsync(fileId);
            _logger.LogInformation("Successfully deleted image from ImageKit: {FileId}", fileId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image from ImageKit: {FileId}", fileId);
            return false;
        }
    }
}
