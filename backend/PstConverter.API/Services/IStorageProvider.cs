using System.IO;
using System.Threading.Tasks;

namespace PstConverter.Services;

public interface IStorageProvider
{
    //string ProviderName { get; }
    Task UploadFileAsync(string key, Stream stream, string contentType);
    Task<string> GetUploadUrlAsync(string key, string contentType, int expiresInMinutes = 60);
    Task<Stream> DownloadFileAsync(string key);

    Task DeleteFileAsync(string key);
    Task<bool> FileExistsAsync(string key);
    Task<string> GetDownloadUrlAsync(string key, int expiresInMinutes);
}
