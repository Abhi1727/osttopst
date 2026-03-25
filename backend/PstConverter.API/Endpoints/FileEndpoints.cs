using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using PstConverter.Extensions;

namespace PstConverter.Endpoints;

public static class FileEndpoints
{
    /// <summary>
    /// Extension method to map file-related API endpoints (upload, initialization, chunking, finalization, and deletion).
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapFileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");
        
        group.MapGet("/diag/claims", (ClaimsPrincipal user) => {
            return Results.Ok(user.Claims.Select(c => new { c.Type, c.Value }));
        }).RequireAuthorization();

        group.MapGet("/diag/licenses", async (PstConverter.Data.AppDbContext db) => {
            var licenses = await db.MockLicenses.ToListAsync();
            return Results.Ok(licenses);
        }).AllowAnonymous();

        // ======== LEGACY SINGLE-FILE UPLOAD (kept for backward compatibility with small files) ========
        group.MapPost("/upload", async ([FromForm] IFormFile file, [FromForm] string? password, [FromForm] string? email, PstService pstService, LicenseApiClient licenseClient, ClaimsPrincipal user, IConfiguration config, ILogger<Program> logger) =>
        {
            try
            {
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Upload request received. File: {FileName}, Size: {Size} bytes",
                        file?.FileName, file?.Length);
                }

                if (file == null || file.Length == 0)
                {
                    logger.LogWarning("Upload rejected: No file uploaded");
                    return Results.BadRequest(new { error = "No file uploaded" });
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (ext != ".pst" && ext != ".ost")
                {
                    logger.LogWarning("Upload rejected: Invalid file type {Extension} for file {FileName}", ext, file.FileName);
                    return Results.BadRequest(new { error = $"The file '{file.FileName}' is not a valid Outlook data file. Only .pst and .ost are allowed." });
                }

                var userId = user.GetInternalUserId();
                var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]);
                
                if (logger.IsEnabled(LogLevel.Information))
                {
                   logger.LogInformation("[AUTH DEBUG] User: {UserId}, Identified Email: {Email}", userId, userEmail);
                }

                // Strict License Check: Reject if prospective upload exceeds limit
                if (await licenseClient.WillExceedLimitAsync(userEmail, file.Length))
                {
                    logger.LogWarning("Upload rejected: File {FileName} ({Size} bytes) would exceed limit for {UserId}", 
                        file.FileName, file.Length, userId);
                    return Results.Json(new { error = "LimitReached" }, statusCode: StatusCodes.Status403Forbidden);
                }

                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("Processing file for user: {UserId}", userId);

                using var stream = file.OpenReadStream();
                if (!IsValidOutlookDataFile(stream, ext))
                {
                    logger.LogWarning("Upload rejected: Invalid file signature for file {FileName} with extension {Extension}", file.FileName, ext);
                    return Results.BadRequest(new { error = $"The file '{file.FileName}' does not have a valid {ext.ToUpperInvariant().TrimStart('.')} signature." });
                }
                var sessionId = await pstService.SaveUploadedFileAsync(stream, file.FileName, userId, file.Length, userEmail, password);
                
                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("File uploaded successfully. SessionId: {SessionId}, FileName: {FileName}", sessionId, file.FileName);
                return Results.Ok(new { sessionId, fileName = file.FileName, size = file.Length, fileType = ext.TrimStart('.') });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Upload failed with exception: {Message}", ex.Message);
                return Results.Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    title: "Failed to process file",
                    statusCode: 500);
            }
        })
        .DisableAntiforgery()
        .AllowAnonymous()
        .WithName("UploadPst")
        .WithTags("File Operations")
        .WithSummary("Upload a PST/OST file (single request, for small files)")
        .WithDescription("Saves the uploaded file and returns a session ID for subsequent operations.");
        //.RequireAuthorization();

        // ======== CHUNKED UPLOAD ENDPOINTS ========

        /// 1. Initialize chunked upload - returns an uploadId
        group.MapPost("/upload/init", async (
            [FromBody] InitUploadRequest request,
            PstService pstService,
            LicenseApiClient licenseClient,
            ClaimsPrincipal user,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FileName))
                    return Results.BadRequest(new { error = "File name is required" });

                var ext = Path.GetExtension(request.FileName).ToLowerInvariant();
                if (ext != ".pst" && ext != ".ost")
                    return Results.BadRequest(new { error = $"Only .pst and .ost files are accepted." });

                if (request.TotalChunks <= 0)
                    return Results.BadRequest(new { error = "TotalChunks must be positive" });

                if (logger.IsEnabled(LogLevel.Information))
                {
                    var claimsList = string.Join(", ", user.Claims.Select(c => $"{c.Type}={c.Value}"));
                    logger.LogInformation("[AUTH DIAG] InitChunkedUpload - Claims: {Claims}", claimsList);
                }

                var userId = user.GetInternalUserId();
                var userEmail = user.GetUserEmailId(request.Email, config["LicenseApi:UserId"]);

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("[AUTH DEBUG] InitChunkedUpload - User: {UserId}, Identified Email: {Email}", userId, userEmail);
                }

                // Strict License Check: Reject if prospective upload exceeds limit
                if (await licenseClient.WillExceedLimitAsync(userEmail, request.TotalSize))
                {
                    logger.LogWarning("Chunked upload rejected: File {FileName} ({Size} bytes) would exceed limit for {UserId}", 
                        request.FileName, request.TotalSize, userId);
                    return Results.Json(new { error = "LimitReached" }, statusCode: StatusCodes.Status403Forbidden);
                }

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Init chunked upload: file={FileName}, chunks={TotalChunks}, size={TotalSize}, user={UserId}",
                        request.FileName, request.TotalChunks, request.TotalSize, userId);
                }

                var uploadId = await pstService.InitChunkedUploadAsync(request.FileName, userId, request.TotalChunks, request.TotalSize, userEmail);

                return Results.Ok(new { uploadId, totalChunks = request.TotalChunks });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Init chunked upload failed: {Message}", ex.Message);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("InitChunkedUpload")
        .WithTags("File Operations")
        .WithSummary("Initialize a chunked upload session")
        .RequireAuthorization();

        /// 2. Upload a single chunk
        group.MapPost("/upload/{uploadId}/chunk/{chunkIndex:int}", async (
            string uploadId,
            int chunkIndex,
            IFormFile chunk,
            PstService pstService,
            ClaimsPrincipal user,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            try
            {
                if (chunk == null || chunk.Length == 0)
                    return Results.BadRequest(new { error = "No chunk data received" });

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Chunk upload: uploadId={UploadId}, chunk={ChunkIndex}, size={Size}",
                        uploadId, chunkIndex, chunk.Length);
                }

                using var stream = chunk.OpenReadStream();
                var userId = user.GetInternalUserId();
                var (success, receivedCount) = await pstService.SaveChunkAsync(uploadId, userId, chunkIndex, stream);

                return Results.Ok(new { success, chunkIndex, receivedCount });
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Chunk upload rejected: {Message} for upload {UploadId}", ex.Message, uploadId);
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (FileNotFoundException ex)
            {
                logger.LogWarning("Chunk upload: upload session not found: {UploadId}", uploadId);
                return Results.NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Chunk upload failed: uploadId={UploadId}, chunk={ChunkIndex}", uploadId, chunkIndex);
                return Results.Problem(ex.Message);
            }
        })
        .DisableAntiforgery()
        .WithName("UploadChunk")
        .WithTags("File Operations")
        .WithSummary("Upload a single chunk of a large file")
        .RequireAuthorization();

        /// 2b. Abort chunked upload
        group.MapDelete("/upload/{uploadId}", async (
            string uploadId,
            PstService pstService,
            ClaimsPrincipal user,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            try
            {
                var userId = user.GetInternalUserId();
                await pstService.AbortChunkedUploadAsync(uploadId, userId);
                return Results.NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Abort chunked upload failed: {UploadId}", uploadId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("AbortChunkedUpload")
        .WithTags("File Operations")
        .WithSummary("Abort an ongoing chunked upload and clean up temporary files")
        .RequireAuthorization();

        /// 3. Finalize - merge all chunks into the final file
        group.MapPost("/upload/{uploadId}/finalize", async (
            string uploadId,
            PstService pstService,
            LicenseApiClient licenseClient,
            ClaimsPrincipal user,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            try
            {
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Finalize chunked upload: uploadId={UploadId}", uploadId);
                }

                var userId = user.GetInternalUserId();
                var userEmail = user.GetUserEmailId(null, config["LicenseApi:UserId"]);
                var result = await pstService.FinalizeChunkedUploadAsync(uploadId, userId, userEmail);

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Chunked upload finalized: uploadId={UploadId} -> sessionId={SessionId}", uploadId, result.SessionId);
                }
                return Results.Accepted($"/api/sessions/{result.SessionId}/check", new
                {
                    sessionId = result.SessionId,
                    fileName = result.FileName,
                    size = result.Size,
                    fileType = result.FileType,
                    status = "Assembling",
                    message = "File assembly started in background"
                });
            }
            catch (FileNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Finalize chunked upload failed: {UploadId}", uploadId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("FinalizeChunkedUpload")
        .WithTags("File Operations")
        .WithSummary("Finalize a chunked upload by merging all chunks")
        .RequireAuthorization();

        // ======== DELETE SESSION ========
        group.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, ClaimsPrincipal user, IConfiguration config, AppDbContext db) =>
        {
            var userId = user.GetInternalUserId();
            var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null) return Results.NotFound();

            await pstService.CleanUpAsync(sessionId);
            db.ConversionSessions.Remove(session);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteSession")
        .WithTags("File Operations")
        .RequireAuthorization();
    }

    /// <summary>
    /// Validates if a given stream has a valid Outlook data file (!BDN) signature and matches the expected extension.
    /// </summary>
    /// <param name="stream">The file stream to validate.</param>
    /// <param name="expectedExtension">The expected file extension (.pst or .ost).</param>
    /// <returns>True if the file signature and version are valid; otherwise, false.</returns>
    
    //this is for validating the outlook data file
    public static bool IsValidOutlookDataFile(Stream stream, string expectedExtension)
    {
        if (stream.Length < 12) return false;

        var start = stream.Position;
        var buffer = new byte[12];
        var read = stream.Read(buffer, 0, 12);
        stream.Position = start;

        // Check the 4-byte magic word (!BDN)
        if (read < 12 || buffer[0] != 0x21 || buffer[1] != 0x42 || buffer[2] != 0x44 || buffer[3] != 0x4E)
        {
            return false;
        }

        short wVer = BitConverter.ToInt16(buffer, 10);
        expectedExtension = expectedExtension.ToLowerInvariant();

        // Check format version constraints
        if (expectedExtension == ".pst" && (wVer == 36 || wVer == 38))
        {
            // PST cannot have OST 2013/2016 wVer values
            return false;
        }

        return true;
    }
}

// Request DTOs
public record InitUploadRequest(string FileName, int TotalChunks, long TotalSize, string? Password = null, string? Email = null);
