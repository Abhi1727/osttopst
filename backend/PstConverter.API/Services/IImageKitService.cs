using Microsoft.AspNetCore.Http;

namespace PstConverter.Services;

public interface IImageKitService
{
    Task<string?> UploadImageAsync(IFormFile file, string fileName);
    Task<string?> UploadImageAsync(byte[] bytes, string fileName);
    Task<bool> DeleteImageAsync(string fileId);
}
