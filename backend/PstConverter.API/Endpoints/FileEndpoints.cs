using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;

namespace PstConverter.Endpoints;

public static class FileEndpoints
{
    public static void MapFileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");

        // ======== LEGACY SINGLE-FILE UPLOAD (kept for backward compatibility with small files) ========
        group.MapPost("/upload", async ([FromForm] IFormFile file, [FromForm] string? password, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
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

                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("Processing file for user: {UserId}", userId);

                using var stream = file.OpenReadStream();
                if (!IsValidPstHeader(stream))
                {
                    logger.LogWarning("Upload rejected: Invalid file signature for file {FileName}", file.FileName);
                    return Results.BadRequest(new { error = $"The file '{file.FileName}' does not have a valid PST/OST signature." });
                }
                var sessionId = await pstService.SaveUploadedFileAsync(stream, file.FileName, userId, file.Length, password);

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
        .WithName("UploadPst")
        .WithTags("File Operations")
        .WithSummary("Upload a PST/OST file (single request, for small files)")
        .WithDescription("Saves the uploaded file and returns a session ID for subsequent operations.")
        .RequireAuthorization();

        // ======== CHUNKED UPLOAD ENDPOINTS ========

        /// 1. Initialize chunked upload - returns an uploadId
        group.MapPost("/upload/init", async (
            [FromBody] InitUploadRequest request,
            PstService pstService,
            ClaimsPrincipal user,
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

                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Init chunked upload: file={FileName}, chunks={TotalChunks}, size={TotalSize}, user={UserId}",
                        request.FileName, request.TotalChunks, request.TotalSize, userId);
                }

                var uploadId = await pstService.InitChunkedUploadAsync(request.FileName, userId, request.TotalChunks, request.TotalSize);

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
                if (chunkIndex == 0 && !IsValidPstHeader(stream))
                {
                    logger.LogWarning("Chunk upload rejected: Invalid file signature for upload {UploadId}", uploadId);
                    return Results.BadRequest(new { error = "The file does not have a valid PST/OST signature." });
                }

                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
                var (success, receivedCount) = await pstService.SaveChunkAsync(uploadId, userId, chunkIndex, stream);

                return Results.Ok(new { success, chunkIndex, receivedCount });
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
            ILogger<Program> logger) =>
        {
            try
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
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
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            try
            {
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Finalize chunked upload: uploadId={UploadId}", uploadId);
                }

                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
                var result = await pstService.FinalizeChunkedUploadAsync(uploadId, userId);

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
        group.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null) return Results.NotFound();

            pstService.CleanUp(sessionId);
            db.ConversionSessions.Remove(session);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteSession")
        .WithTags("File Operations")
        .RequireAuthorization();
    }

    private static bool IsValidPstHeader(Stream stream)
    {
        if (stream.Length < 4) return false;
        var start = stream.Position;
        var buffer = new byte[4];
        var read = stream.Read(buffer, 0, 4);
        stream.Position = start;
        return read == 4 && buffer[0] == 0x21 && buffer[1] == 0x42 && buffer[2] == 0x44 && buffer[3] == 0x4E;
    }
}

// Request DTOs
public record InitUploadRequest(string FileName, int TotalChunks, long TotalSize, string? Password = null);
