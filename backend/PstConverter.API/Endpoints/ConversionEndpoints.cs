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
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool? excludeEmptyFolders,
            PstService pstService,
            AppDbContext db,
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("ExportAll request: session={SessionId}, format={Format}, excludeEmpty={ExcludeEmpty}, userId={UserId}", sessionId, format, excludeEmptyFolders, userId);
            }
            var filter = new MessageDateFilter
            {
                Year = year,
                Month = month,
                StartDate = startDate,
                EndDate = endDate
            };

            try
            {
                var exportFormat = ExportFormatHelpers.Parse(format);
                var (filePath, isReady) = await pstService.ExportAllAsync(sessionId, userId, exportFormat, filter, excludeEmptyFolders ?? false);

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

                return Results.File(filePath, "application/zip", "pst_export.zip");
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

        group.MapGet("/{sessionId}/convert-to-pst", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, PstService pstService, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                var (filePath, fileName, isReady) = await pstService.ConvertOstToPstAsync(sessionId, userId, excludeEmptyFolders ?? false);

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

                return Results.File(filePath, "application/vnd.ms-outlook", fileName);
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

        group.MapGet("/{sessionId}/convert-to-ost", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, PstService pstService, AppDbContext db, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                var (filePath, fileName, isReady) = await pstService.ConvertPstToOstAsync(sessionId, userId, excludeEmptyFolders ?? false);

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

                return Results.File(filePath, "application/vnd.ms-outlook", fileName);
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
    }
}
