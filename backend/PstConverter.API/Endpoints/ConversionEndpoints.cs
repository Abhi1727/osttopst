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
    /// <summary>
    /// Extension method to map conversion-related API endpoints.
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapConversionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");
        //THIS IS FOR EXPORT ALL FILES
        group.MapGet("/{sessionId}/export", async (string sessionId,
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

            // Get comprehensive license status (handles caches, tiers, and limits)
            var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
            
            if (!status.CanConvert)
            {
                return Results.Json(new { error = status.Tier }, statusCode: StatusCodes.Status403Forbidden);
            }

            // compare module status with active and professional tier
            var moduleStatus = await LicenseApiClient.GetModuleVersion();
            if (status.Tier == LicenseTier.Professional && moduleStatus != ModuleLicenseType.Active)
            {
                return Results.Json(new { error = moduleStatus }, statusCode: StatusCodes.Status403Forbidden);
            }

            // A re-download is when the session is already IsPaid (converted previously).
            // In that case skip the item-count gate — the slot was already consumed.
            var sessionForCheck = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            bool isRedownload = sessionForCheck?.IsPaid == true;

            if (moduleStatus == ModuleLicenseType.Active)
            {
                if (isRedownload)
                {
                    // Re-download: only block on storage/time — item count already consumed.
                    if (status.HitSizeLimit || status.HitTimePeriodLimit)
                        return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                }
                else
                {
                    // New conversion: full gate including item count.
                    if (status.HitFileCountLimit || status.HitSizeLimit || status.HitTimePeriodLimit || status.IsUsageRestricted)
                        return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                }
            }
            // Track usage
            // _ = licenseClient.TrackUsageAsync(userEmail);

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
                var (filePath, isReady) = await pstService.ExportAllAsync(sessionId,
                                                                           userId,
                                                                           exportFormat,
                                                                           status.Tier == LicenseTier.Demo,
                                                                           folderId,
                                                                           selectedIds,
                                                                           filter,
                                                                          excludeEmptyFolders ?? true,
                                                                          userEmail);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                // Mark as paid upon successful extraction
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (session != null)
                {
                    // Paid status is now set in the PstService background task
                    await db.SaveChangesAsync();
                }

                // Use a more standard filename for the export
                var exportFileName = string.IsNullOrEmpty(sessionId) ? "export.zip" : $"export_{sessionId}.zip";
                return Results.File(filePath, "application/zip", exportFileName, enableRangeProcessing: true);
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
                // try
                // {
                //     var logPath = @"C:\temp\debug_log.txt";
                //     File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] ERROR in ConversionEndpoints: {ex.Message}{Environment.NewLine}{ex.StackTrace}{Environment.NewLine}");
                //     Console.WriteLine($"[ERROR] {ex.Message}");
                // }
                // catch { }
                logger.LogError(ex, "ExportAll failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ExportAll")
        .WithTags("Conversion Operations")
        .RequireAuthorization();

        //THIS IS FOR CONVERT OST TO PST
        group.MapGet("/{sessionId}/convert-to-pst", async (string sessionId,
                                                           [FromQuery] bool? excludeEmptyFolders,
                                                           [FromQuery] bool? deduplicate,
                                                           [FromQuery] long? splitSizeMb,
                                                           [FromQuery] string? email,
                                                           PstService pstService,
                                                           LicenseApiClient licenseClient,
                                                           AppDbContext db,
                                                           ClaimsPrincipal user,
                                                           ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userEmail = email ?? user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? userId;

            try
            {
                // Get comprehensive license status (handles caches, tiers, and limits)
                var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
                
                if (!status.CanConvert)
                {
                    return Results.Json(new { error = status.Tier }, statusCode: StatusCodes.Status403Forbidden);
                }

                // Get Module License
                var moduleStatus = await LicenseApiClient.GetModuleVersion();

                // compare module status with active and professional tier
                if (status.Tier == LicenseTier.Professional && moduleStatus != ModuleLicenseType.Active)
                {
                    return Results.Json(new { error = moduleStatus }, statusCode: StatusCodes.Status403Forbidden);
                }

                // A re-download is when the session is already IsPaid (converted previously).
                // In that case skip the item-count gate — the slot was already consumed.
                var sessionForCheck = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
                bool isRedownload = sessionForCheck?.IsPaid == true;

                if (moduleStatus == ModuleLicenseType.Active)
                {
                    if (isRedownload)
                    {
                        // Re-download: only block on storage/time.
                        if (status.HitSizeLimit || status.HitTimePeriodLimit)
                            return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                    }
                    else
                    {
                        // New conversion: full gate including item count.
                        if (status.HitFileCountLimit || status.HitSizeLimit || status.HitTimePeriodLimit || status.IsUsageRestricted)
                            return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                    }
                }

                var (filePath, fileName, isReady) = await pstService.ConvertOstToPstAsync(sessionId,
                                                                                           userId, 
                                                                                           status.Tier == LicenseTier.Demo,
                                                                                           excludeEmptyFolders ?? true, 
                                                                                          userEmail, 
                                                                                           deduplicate ?? false, 
                                                                                           splitSizeMb);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                // Mark as paid upon successful conversion
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (session != null)
                {
                    // Paid status is now set in the PstService background task 
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

        //THIS IS FOR SPLIT FILES
        group.MapGet("/{sessionId}/download/{fileName}", async (string sessionId,
                                                                string fileName,
                                                                [FromQuery] string? email,
                                                                PstService pstService,
                                                                LicenseApiClient licenseClient,
                                                                AppDbContext db,
                                                                ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null) return Results.NotFound();

            // Only block download on storage/time limits — item count was gated at conversion start.
            // Blocking on HitFileCountLimit here prevents the last split file from being served
            // when items used equals allotted (e.g., 5/5).
            var userEmail = email ?? user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("emails") ?? user.FindFirstValue(ClaimTypes.Name) ?? "anonymous";
            var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
            if (!status.CanConvert || status.HitSizeLimit || status.HitTimePeriodLimit)
            {
                return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
            }

            if (session.SplitFilesJson != null)
            {
                var files = System.Text.Json.JsonSerializer.Deserialize<string[]>(session.SplitFilesJson);
                if (files != null && files.Contains(fileName))
                {
                    var filePath = Path.Combine(pstService.GetUploadDir(), fileName);
                    if (File.Exists(filePath))
                    {
                        var contentType = fileName.EndsWith(".pst", StringComparison.OrdinalIgnoreCase) 
                            ? "application/vnd.ms-outlook" 
                            : "application/octet-stream";
                        return Results.File(filePath, contentType, fileName, enableRangeProcessing: true);
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
