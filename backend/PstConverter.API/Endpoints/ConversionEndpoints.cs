using System.IO;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;

namespace PstConverter.Endpoints;

public static class ConversionEndpoints
{
    public static void MapConversionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");

        group.MapGet("/{sessionId}/export", async (
            string sessionId,
            [FromQuery] string? format,
            [FromQuery] string? folderId,
            [FromQuery] string? entryIds,
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool? excludeEmptyFolders,
            [FromQuery] string? email,
            PstService pstService,
            LicenseApiClient licenseClient,
            AppDbContext db,
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userEmail = email ?? user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? userId;

            // License Check
            var license = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
            if (!license.CanConvert)
            {
                return Results.Json(new { error = license.Message }, statusCode: StatusCodes.Status403Forbidden);
            }

            // Track usage
            _ = licenseClient.TrackUsageAsync(userEmail);

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("ExportAll request: session={SessionId}, format={Format}, folderId={FolderId}, userId={UserId}", sessionId, format, folderId, userId);
            }
            var filter = new MessageDateFilter
            {
                Year = year,
                Month = month,
                StartDate = startDate,
                EndDate = endDate
            };

            List<string>? selectedIds = !string.IsNullOrEmpty(entryIds)
                ? [.. entryIds.Split(',', StringSplitOptions.RemoveEmptyEntries)]
                : null;

            try
            {
                var exportFormat = ExportFormatHelpers.Parse(format);
                var (filePath, isReady) = await pstService.ExportAllAsync(sessionId, userId, exportFormat, folderId, selectedIds, filter, excludeEmptyFolders ?? true, userEmail);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                // Mark as paid upon successful extraction
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (session != null)
                {
                    session.IsPaid = true;
                    await db.SaveChangesAsync();
                }

                return Results.File(filePath, "application/zip", "pst_export.zip", enableRangeProcessing: true);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (FileNotFoundException ex)
            {
                logger.LogWarning("ExportAll: File not found for session {SessionId}: {Message}", sessionId, ex.Message);
                return Results.Problem(
                    detail: ex.Message,
                    title: "Session file no longer available",
                    statusCode: StatusCodes.Status410Gone);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("ExportAll: Unauthorized for session {SessionId}", sessionId);
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                try
                {
                    var logPath = @"C:\temp\debug_log.txt";
                    File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] ERROR in ConversionEndpoints: {ex.Message}{Environment.NewLine}{ex.StackTrace}{Environment.NewLine}");
                    Console.WriteLine($"[ERROR] {ex.Message}");
                }
                catch { }
                logger.LogError(ex, "ExportAll failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ExportAll")
        .WithTags("Conversion Operations")
        .RequireAuthorization();

        group.MapGet("/{sessionId}/convert-to-pst", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, [FromQuery] bool? deduplicate, [FromQuery] long? splitSizeMb, [FromQuery] string? email, PstService pstService, LicenseApiClient licenseClient, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userEmail = email ?? user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? userId;

            // License Check
            var license = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
            if (!license.CanConvert)
            {
                return Results.Json(new { error = license.Message }, statusCode: StatusCodes.Status403Forbidden);
            }

            // Track usage
            _ = licenseClient.TrackUsageAsync(userEmail);

            try
            {
                var (filePath, fileName, isReady) = await pstService.ConvertOstToPstAsync(sessionId, userId, excludeEmptyFolders ?? true, userEmail, deduplicate ?? false, splitSizeMb);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                // Mark as paid upon successful conversion
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (session != null)
                {
                    session.IsPaid = true;
                    await db.SaveChangesAsync();
                }

                // If split files exist, return status indicating multiple files
                if (!string.IsNullOrEmpty(session?.SplitFilesJson))
                {
                    // Frontend should use the /download/{fileName} endpoint instead of this return file
                    return Results.Accepted();
                }

                return Results.File(filePath, "application/vnd.ms-outlook", fileName, enableRangeProcessing: true);
            }
            catch (FileNotFoundException)
            {
                return Results.NotFound(new { error = "Session not found" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ConvertToPst failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ConvertToPst")
        .WithTags("Conversion Operations")
        .RequireAuthorization();

        group.MapGet("/{sessionId}/convert-to-ost", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, [FromQuery] bool? deduplicate, [FromQuery] long? splitSizeMb, [FromQuery] string? email, PstService pstService, LicenseApiClient licenseClient, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userEmail = email ?? user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? userId;

            // License Check
            var license = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
            if (!license.CanConvert)
            {
                return Results.Json(new { error = license.Message }, statusCode: StatusCodes.Status403Forbidden);
            }

            // Track usage
            _ = licenseClient.TrackUsageAsync(userEmail);

            try
            {
                var (filePath, fileName, isReady) = await pstService.ConvertPstToOstAsync(sessionId, userId, excludeEmptyFolders ?? true, userEmail, deduplicate ?? false, splitSizeMb);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                // Mark as paid upon successful conversion
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (session != null)
                {
                    session.IsPaid = true;
                    await db.SaveChangesAsync();
                }

                // If split files exist, return status indicating multiple files
                if (!string.IsNullOrEmpty(session?.SplitFilesJson))
                {
                    // Frontend should use the /download/{fileName} endpoint instead of this return file
                    return Results.Accepted();
                }

                return Results.File(filePath, "application/vnd.ms-outlook", fileName, enableRangeProcessing: true);
            }
            catch (FileNotFoundException)
            {
                return Results.NotFound(new { error = "Session not found" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ConvertToOst failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ConvertToOst")
        .WithTags("Conversion Operations")
        .RequireAuthorization();

        group.MapGet("/{sessionId}/download/{fileName}", async (string sessionId, string fileName, PstService pstService, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null) return Results.NotFound();

            if (session.SplitFilesJson != null)
            {
                var files = System.Text.Json.JsonSerializer.Deserialize<string[]>(session.SplitFilesJson);
                if (files != null && files.Contains(fileName))
                {
                    var filePath = Path.Combine(pstService.GetUploadDir(), fileName);
                    if (File.Exists(filePath))
                    {
                        return Results.File(filePath, "application/octet-stream", fileName, enableRangeProcessing: true);
                    }
                }
            }
            return Results.NotFound(new { error = "File not found" });
        })
        .WithName("DownloadSplitFile")
        .WithTags("Conversion Operations")
        .RequireAuthorization();
    }
}
