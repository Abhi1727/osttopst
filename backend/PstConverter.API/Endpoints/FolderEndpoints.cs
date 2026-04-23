using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;
using PstConverter.Extensions;

namespace PstConverter.Endpoints;

public static class FolderEndpoints
{
    /// <summary>
    /// Extension method to map folder-related API endpoints (listing folder tree and exporting specific folders).
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapFolderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");

        group.MapGet("/{sessionId}/folders", async (string sessionId, [FromQuery] bool? excludeEmptyFolders, PstService pstService, ClaimsPrincipal user, IConfiguration config, ILogger<Program> logger) =>
        {
            var userId = user.GetInternalUserId();
            var userEmail = user.GetUserEmailId(null, config["LicenseApi:UserId"]);
            try
            {
                return Results.Ok(await pstService.GetFolderTreeAsync(sessionId, userId, excludeEmptyFolders ?? true));
            }
            catch (FileNotFoundException)
            {
                return Results.NotFound(new { error = "Session not found" });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetFolders failed for session {SessionId}. Error: {Message}", sessionId, ex.Message);
                return Results.Problem(detail: ex.ToString(), title: "GetFolders failed", statusCode: 500);
            }
        })
        .WithName("GetFolders")
        .WithTags("Folder Operations")
        .WithSummary("Get the folder tree for the current session")
        .RequireAuthorization();

        group.MapGet("/{sessionId}/folders/export", async (
            string sessionId,
            [FromQuery] string folderId,
            [FromQuery] string? format,
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] DateTime? startDate,

            [FromQuery] DateTime? endDate,
            [FromQuery] string? email,
            PstService pstService,
            ClaimsPrincipal user,
            IConfiguration config,
            ILogger<Program> logger,
            DownloadCleanup cleanup) =>
        {
            var userId = user.GetInternalUserId();
            var userEmail = user.GetUserEmailId(email, config["LicenseApi:UserId"]);

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("ExportFolder request: session={SessionId}, folder={FolderId}, format={Format}, userEmail={Email}", sessionId, folderId, format, userEmail);
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
                var filePath = await pstService.ExportFolderAsync(sessionId, userId, folderId, exportFormat, filter, userEmail);
                cleanup.ScheduleDelete(filePath);
                return Results.File(filePath, "application/zip", "folder_export.zip");
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("ExportFolder: Unauthorized for session {SessionId}", sessionId);
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ExportFolder failed for session {SessionId}, folder {FolderId}", sessionId, folderId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ExportFolder")
        .WithTags("Folder Operations")
        .RequireAuthorization();
    }
}
