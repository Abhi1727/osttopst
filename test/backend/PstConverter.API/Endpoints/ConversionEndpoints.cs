using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;

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
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("ExportAll request: session={SessionId}, format={Format}, excludeEmpty={ExcludeEmpty}", sessionId, format, excludeEmptyFolders);
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
                // Buffer into memory first so exceptions (e.g. UnauthorizedAccessException)
                // are thrown here rather than inside the Results.Stream callback where they
                // cannot be caught and result in a 500 instead of a 403.
                var ms = new MemoryStream();
                await pstService.ExportAllAsync(ms, sessionId, userId, exportFormat, filter, excludeEmptyFolders ?? false);
                ms.Position = 0;
                return Results.Stream(ms, "application/zip", "pst_export.zip");
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("ExportAll: Unauthorized for session {SessionId}", sessionId);
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ExportAll failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ExportAll")
        .WithTags("Conversion Operations")
        .RequireAuthorization();

        group.MapGet("/{sessionId}/convert-to-pst", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                var (data, fileName) = await pstService.ConvertOstToPstAsync(sessionId, userId, excludeEmptyFolders ?? false);
                return Results.Stream(data, "application/vnd.ms-outlook", fileName);
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

        group.MapGet("/{sessionId}/convert-to-ost", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                var (data, fileName) = await pstService.ConvertPstToOstAsync(sessionId, userId, excludeEmptyFolders ?? false);
                return Results.Stream(data, "application/vnd.ms-outlook", fileName);
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
