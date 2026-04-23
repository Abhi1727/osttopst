using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PstConverter.Services;
using System.Threading.Tasks;
using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;


namespace PstConverter.Endpoints;

public static class StorageEndpoints
{
    public static void MapStorageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/storage");

        group.MapGet("/presigned-upload", async (string fileName, string contentType, IHybridStorageService storage) =>
        {
            var sessionId = Guid.NewGuid().ToString("N");
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".pst";
            var key = $"{sessionId}{ext}";
            
            var url = await storage.GetPresignedUploadUrlAsync(key, contentType);
            
            return Results.Ok(new { url, key, sessionId });
        });

        // After frontend finishes uploading to R2, it calls this to trigger sync to Local VM
        group.MapPost("/finalize-external-upload", async ([FromBody] FinalizeUploadRequest request, IHybridStorageService storage, PstService pstService) =>
        {
            if (string.IsNullOrEmpty(request.Key)) return Results.BadRequest("Key is required");

            // 1. Sync from R2 to Local VM storage
            await storage.SyncR2ToLocalAsync(request.Key);

            // 2. Register session in DB
            var sessionId = await pstService.RegisterExternalUploadAsync(
                request.Key, 
                request.OriginalFileName, 
                request.UserId, 
                request.Size);

            
            return Results.Ok(new { sessionId });
        });
    }
}

public record FinalizeUploadRequest(string Key, string OriginalFileName, string UserId, long Size);

