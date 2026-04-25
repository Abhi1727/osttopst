using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Threading.Tasks;

namespace PstConverter.Services;

public class R2StorageProvider : IStorageProvider
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    //public string ProviderName => "CloudflareR2";

    public R2StorageProvider(IConfiguration configuration)
    {
        var accessKey = configuration["CloudflareR2:AccessKeyId"];
        var secretKey = configuration["CloudflareR2:SecretAccessKey"];
        var accountId = configuration["CloudflareR2:AccountId"];
        _bucketName = configuration["CloudflareR2:BucketName"] ?? "osttopst";
        
        var serviceUrl = $"https://{accountId}.r2.cloudflarestorage.com";

        var config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(accessKey, secretKey, config);
    }

    public Task<string> GetUploadUrlAsync(string key, string contentType, int expiresInMinutes = 60)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes)
        };
        return Task.FromResult(_s3Client.GetPreSignedURL(request));
    }

    public async Task UploadFileAsync(string key, Stream stream, string contentType)
    {
        var fileTransferUtility = new TransferUtility(_s3Client);
        await fileTransferUtility.UploadAsync(new TransferUtilityUploadRequest
        {
            InputStream = stream,
            Key = key,
            BucketName = _bucketName,
            ContentType = contentType,
            DisablePayloadSigning = true, // Required for Cloudflare R2 streaming compatibility
            ChecksumAlgorithm = null      // Ensure no checksum algorithm is selected
        });
    }

    public async Task<Stream> DownloadFileAsync(string key)
    {
        var response = await _s3Client.GetObjectAsync(_bucketName, key);
        return response.ResponseStream;
    }

    public async Task DeleteFileAsync(string key)
    {
        await _s3Client.DeleteObjectAsync(_bucketName, key);
    }

    public async Task<bool> FileExistsAsync(string key)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(_bucketName, key);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public Task<string> GetDownloadUrlAsync(string key, int expiresInMinutes)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes)
        };
        return Task.FromResult(_s3Client.GetPreSignedURL(request));
    }
}
