using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PstConverter.Services;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Extensions;
using System.Security.Claims;


namespace PstConverter.Endpoints;

public static class StorageEndpoints
{
    public static void MapStorageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/storage");
        // Example: GET /api/storage/presigned-upload?fileName=test.ost&contentType=application%2Foctet-stream&email=xziantseo%40gmail.com
        //when user uploads a file, it will call this endpoint to get a presigned url to upload the file to R2
        group.MapGet("/presigned-upload", async (string fileName, 
                                                 string contentType, 
                                                 [FromQuery] string? email,
                                                 IHybridStorageService storage,
                                                 ClaimsPrincipal user,
                                                 IConfiguration config) =>
        {
            var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]) ?? "anonymous";
            var sessionId = Guid.NewGuid().ToString("N");
            var key = $"osttopst/upload/{userEmail}/{sessionId}/{fileName}";
            
            var url = await storage.GetPresignedUploadUrlAsync(key, contentType);
            
            return Results.Ok(new { url, key, sessionId });
        });

        // After frontend finishes uploading to R2, it calls this to trigger sync to Local VM
        // Example: POST /api/storage/finalize-external-upload
        group.MapPost("/finalize-external-upload", async ([FromBody] FinalizeUploadRequest request, 
                                                           IHybridStorageService storage, 
                                                           PstService pstService,
                                                           ClaimsPrincipal user,
                                                           IConfiguration config,
                                                           ILogger<Program> logger) =>
        {
            try
            {
                if (string.IsNullOrEmpty(request.Key)) return Results.BadRequest(new { error = "Key is required" });
                if (string.IsNullOrEmpty(request.SessionId)) return Results.BadRequest(new { error = "SessionId is required" });

                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("[Storage] Finalizing upload for Key: {Key}, SessionId: {SessionId}", request.Key, request.SessionId);

                // 1. Sync from R2 to Local VM storage
                await storage.SyncR2ToLocalAsync(request.Key);

                // 2. Register session in DB
                var userEmail = user.GetUserEmailId(request.Email, config["LicenseApi:UserId"]);
                var sessionId = await pstService.RegisterExternalUploadAsync(
                    request.Key, 
                    request.OriginalFileName, 
                    request.UserId, 
                    request.Size,
                    request.SessionId,
                    userEmail);

                return Results.Ok(new { sessionId });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "[Storage] Validation failed for Key: {Key}", request.Key);
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (IOException ex)
            {
                logger.LogError(ex, "[Storage] IO error during finalize for Key: {Key}", request.Key);
                return Results.Problem(detail: "File system error occurred during processing.", title: "Upload Finalization Error");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[Storage] FinalizeExternalUpload failed for Key: {Key}", request.Key);
                return Results.Problem(detail: "An unexpected error occurred while finalizing the upload.", title: "Finalize Upload Failed");
            }
        });
    }
}

public record FinalizeUploadRequest(string Key, string OriginalFileName, string UserId, long Size, string SessionId, string? Email = null);

