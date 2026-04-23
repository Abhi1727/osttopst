using System.IO;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using PstConverter.Extensions;

namespace PstConverter.Endpoints;

internal static class DownloadCleanup
{
    private static readonly TimeSpan DeleteDelay = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Fires a background task that deletes <paramref name="filePath"/> after 30 seconds.
    /// Safe to call even if the file does not exist.
    /// </summary>
    public static void ScheduleDelete(string filePath, ILogger logger)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(DeleteDelay);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    logger.LogInformation("[DownloadCleanup] Deleted converted output: {File}", Path.GetFileName(filePath));
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("[DownloadCleanup] Could not delete {File}: {Msg}", Path.GetFileName(filePath), ex.Message);
            }
        });
    }
}

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
                                                    IConfiguration config,
                                                    ILogger<Program> logger,
                                                    IHybridStorageService storageService) =>
        {
            var userId = user.GetInternalUserId();
            var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]);

            var sessionForCheck = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            var itemName = sessionForCheck != null ? $"{sessionForCheck.OriginalFileName}{sessionForCheck.Size}" : sessionId;

            // Get comprehensive license status (handles caches, tiers, and limits)
            var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail, itemName);
            
            // Allow export to start even if license is expired/limited.
            // Under significantly limited states, we fallback to Demo limits (partial export).
            bool isActuallyDemo = status.Tier == LicenseTier.Demo || !status.CanConvert;

            if (!status.CanConvert && status.Tier != LicenseTier.DemoExpired && status.Tier != LicenseTier.Professional)
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

                    if (sessionForCheck != null)
                    {
                        // Strict License Check: Reject if prospective conversion exceeds limit
                        if (await licenseClient.WillExceedLimitAsync(userEmail, sessionForCheck.Size))
                        {
                            if (logger.IsEnabled(LogLevel.Information))
                                logger.LogWarning("Export rejected: File session {SessionId} ({Size} bytes) would exceed limit for {UserId}", sessionId, sessionForCheck.Size, userId);
                            return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                        }

                        // Professional users: 5GB file size hard limit
                        const long ProfessionalFileSizeLimit = 5L * 1024 * 1024 * 1024;
                        if (sessionForCheck.Size > ProfessionalFileSizeLimit && status.Tier == LicenseTier.Professional)
                        {
                            if (logger.IsEnabled(LogLevel.Information))
                                logger.LogWarning("Export rejected: Professional user {UserId} file session {SessionId} ({Size} bytes) exceeds 5GB limit", userId, sessionId, sessionForCheck.Size);
                            return Results.Json(new { error = "FileSizeExceeded", status }, statusCode: StatusCodes.Status403Forbidden);
                        }
                    }
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
                                                                           isActuallyDemo,
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
                var baseName = session != null ? Path.GetFileNameWithoutExtension(session.OriginalFileName) : "export";
                var exportFileName = $"{baseName}_{format}.zip";

                // 1. Prioritize R2 Redirect (Always download from R2 directly if available)
                if (session != null && !string.IsNullOrEmpty(session.ConvertedFileKey))
                {
                    if (session.ConvertedFileSize == 0)
                    {
                        return Results.BadRequest(new { error = "Export produced an empty file. Please check your license status." });
                    }
                    var r2Url = await storageService.GetPresignedDownloadUrlAsync(session.ConvertedFileKey);
                    return Results.Redirect(r2Url);
                }

                // 2. Fallback to Local VM (only if not yet synced to R2)
                if (File.Exists(filePath))
                {
                    // Schedule deletion of the export ZIP 30 seconds after the download starts
                    DownloadCleanup.ScheduleDelete(filePath, logger);
                    return Results.File(filePath, "application/zip", exportFileName, enableRangeProcessing: true);
                }

                return Results.NotFound(new { error = "Export file not found" });
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
                                                           IConfiguration config,
                                                           ILogger<Program> logger,
                                                           IHybridStorageService storageService) =>
        {
            var userId = user.GetInternalUserId();
            var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]);

            // Fallback: if JWT has no email claim, try the email stored on the session
            if (userEmail.StartsWith("user_", StringComparison.OrdinalIgnoreCase))
            {
                var sessionForEmailCheck = await db.ConversionSessions.AsNoTracking().FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (sessionForEmailCheck != null && !string.IsNullOrEmpty(sessionForEmailCheck.Email) && !sessionForEmailCheck.Email.StartsWith("user_", StringComparison.OrdinalIgnoreCase))
                    userEmail = sessionForEmailCheck.Email;
            }


            try
            {
                var sessionForCheck = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
                var itemName = sessionForCheck != null ? $"{sessionForCheck.OriginalFileName}{sessionForCheck.Size}" : sessionId;

                // Get comprehensive license status (handles caches, tiers, and limits)
                var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail, itemName);
                
                // Allow conversion to start even if license is expired/limited.
                // PstService.ConvertOstToPstAsync now handles this by falling back to Demo limits (partial conversion).
                if (!status.CanConvert && status.Tier != LicenseTier.DemoExpired && status.Tier != LicenseTier.Demo && status.Tier != LicenseTier.Professional)
                {
                    // Only block if it's completely unrecognized or blocked for other reasons
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

                        if (sessionForCheck != null)
                        {
                            // Strict License Check: Reject if prospective conversion exceeds limit
                            if (await licenseClient.WillExceedLimitAsync(userEmail, sessionForCheck.Size))
                            {
                                if (logger.IsEnabled(LogLevel.Information))
                                    logger.LogWarning("Convert rejected: File session {SessionId} ({Size} bytes) would exceed limit for {UserId}", sessionId, sessionForCheck.Size, userId);
                                return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
                            }

                            // Professional users: 5GB file size hard limit
                            const long ProfessionalFileSizeLimit = 5L * 1024 * 1024 * 1024;
                            if (sessionForCheck.Size > ProfessionalFileSizeLimit && status.Tier == LicenseTier.Professional)
                            {
                                if (logger.IsEnabled(LogLevel.Information))
                                    logger.LogWarning("Convert rejected: Professional user {UserId} file session {SessionId} ({Size} bytes) exceeds 5GB limit", userId, sessionId, sessionForCheck.Size);
                                return Results.Json(new { error = "FileSizeExceeded", status }, statusCode: StatusCodes.Status403Forbidden);
                            }
                        }
                    }
                }

                var (filePath, fileName, isReady) = await pstService.ConvertOstToPstAsync(sessionId,
                                                                                           userId, 
                                                                                           status.Tier == LicenseTier.Demo || !status.CanConvert,
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

                // 1. Prioritize R2 Redirect (Always download from R2 directly if available)
                if (session != null && !string.IsNullOrEmpty(session.ConvertedFileKey))
                {
                    if (session.ConvertedFileSize == 0)
                    {
                        return Results.BadRequest(new { error = "Conversion produced an empty file. Please check your license status." });
                    }
                    var r2Url = await storageService.GetPresignedDownloadUrlAsync(session.ConvertedFileKey);
                    return Results.Redirect(r2Url);
                }

                // 2. Fallback to Local VM (only if not yet synced to R2)
                if (File.Exists(filePath))
                {
                    // Schedule deletion of the converted PST 30 seconds after the download starts
                    DownloadCleanup.ScheduleDelete(filePath, logger);
                    return Results.File(filePath, "application/vnd.ms-outlook", fileName, enableRangeProcessing: true);
                }

                return Results.NotFound(new { error = "Converted file not found" });
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
                                                                ClaimsPrincipal user,
                                                                IConfiguration config,
                                                                ILogger<Program> logger,
                                                                IHybridStorageService storageService) =>
        {
            var userId = user.GetInternalUserId();
            var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null) return Results.NotFound();

            // Only block download on storage/time limits — item count was gated at conversion start.
            // Blocking on HitFileCountLimit here prevents the last split file from being served
            // when items used equals allotted (e.g., 5/5).
            var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]);
            if (userEmail.StartsWith("user_", StringComparison.OrdinalIgnoreCase) && session != null && !string.IsNullOrEmpty(session.Email) && !session.Email.StartsWith("user_", StringComparison.OrdinalIgnoreCase))
            {
                userEmail = session.Email;
            }

            var itemName = $"{session.OriginalFileName}{session.Size}";
            var status = await licenseClient.GetDetailedLicenseStatusAsync(userEmail, itemName);
            if (!status.CanConvert || status.HitSizeLimit || status.HitTimePeriodLimit)
            {
                return Results.Json(new { error = "LimitReached", status }, statusCode: StatusCodes.Status403Forbidden);
            }

            if (session?.SplitFilesJson != null)
            {
                var files = System.Text.Json.JsonSerializer.Deserialize<string[]>(session.SplitFilesJson);
                if (files != null && files.Contains(fileName))
                {
                    // 1. Prioritize R2 Redirect for split files
                    var r2Key = $"osttopst/download/{userEmail ?? "anonymous"}/{sessionId}/{fileName}";
                    var r2Url = await storageService.GetPresignedDownloadUrlAsync(r2Key);
                    
                    // We check if it's ready in DB first to be safe, but since this is a direct download call,
                    // we can try the R2 redirect immediately.
                    if (session.Status?.StartsWith("Ready", StringComparison.OrdinalIgnoreCase) == true)
                    {
                         return Results.Redirect(r2Url);
                    }

                    // 2. Fallback to Local VM
                    var filePath = Path.Combine(pstService.GetUploadDir(), fileName);
                    if (File.Exists(filePath))
                    {
                        var contentType = fileName.EndsWith(".pst", StringComparison.OrdinalIgnoreCase) 
                            ? "application/vnd.ms-outlook" 
                            : "application/octet-stream";

                        DownloadCleanup.ScheduleDelete(filePath, logger);
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
