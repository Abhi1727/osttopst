using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;

namespace PstConverter.Endpoints;

public static class MessageEndpoints
{
    /// <summary>
    /// Extension method to map message-related API endpoints (listing, detail, contacts, calendar, and single/batch export).
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapMessageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");
        //this is for getting the messages for the user
        group.MapGet("/{sessionId}/messages", async (
            string sessionId,
            [FromQuery] string folderId,
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortOrder,
            PstService pstService,
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var filter = new MessageDateFilter
            {
                Year = year,
                Month = month,
                StartDate = startDate,
                EndDate = endDate
            };

            try
            {
                return Results.Ok(await pstService.GetMessagesAsync(sessionId, userId, folderId, filter, sortBy, sortOrder));
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetMessages failed for session {SessionId}, folder {FolderId}", sessionId, folderId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetMessages")
        .WithTags("Message Operations")
        .RequireAuthorization();
        //this is for getting the contacts for the user
        group.MapGet("/{sessionId}/contacts", async (string sessionId, [FromQuery] string folderId, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                return Results.Ok(await pstService.GetContactsAsync(sessionId, userId, folderId));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetContacts failed for folder {FolderId}", folderId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetContacts")
        .WithTags("Folder Operations")
        .RequireAuthorization();
        //this is for getting the calendar items for the user
        group.MapGet("/{sessionId}/calendar", async (string sessionId, [FromQuery] string folderId, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                return Results.Ok(await pstService.GetCalendarItemsAsync(sessionId, userId, folderId));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetCalendarItems failed for folder {FolderId}", folderId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetCalendarItems")
        .WithTags("Folder Operations")
        .RequireAuthorization();
        //this is for getting the message detail for the user
        group.MapGet("/{sessionId}/messages/detail", async (string sessionId, [FromQuery] string entryId, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            try
            {
                var detail = await pstService.GetMessageDetailAsync(sessionId, userId, entryId);
                return detail is null ? Results.NotFound(new { error = "Message not found" }) : Results.Ok(detail);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetMessageDetail failed for session {SessionId}, entry {EntryId}", sessionId, entryId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetMessageDetail")
        .WithTags("Message Operations")
        .RequireAuthorization();
        //this is for exporting the message for the user
        group.MapGet("/{sessionId}/messages/export", (string sessionId, [FromQuery] string entryId, [FromQuery] string? format, PstService pstService, ClaimsPrincipal user, ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("ExportMessage request: session={SessionId}, entry={EntryId}, format={Format}, user={UserId}", sessionId, entryId, format, userId);
            }
            try
            {
                var exportFormat = ExportFormatHelpers.Parse(format);
                var contentType = exportFormat.GetContentType();
                var ext = exportFormat.GetExtension();
                return Results.Stream(async outputStream =>
                {
                    await pstService.ExportMessageAsync(outputStream, sessionId, userId, entryId, exportFormat);
                }, contentType, $"message{ext}");
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("ExportMessage: Unauthorized for session {SessionId}", sessionId);
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ExportMessage failed for session {SessionId}, entry {EntryId}", sessionId, entryId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("ExportMessage")
        .WithTags("Message Operations")
        .RequireAuthorization();
        
        //this is for exporting the messages in batch for the user
        group.MapPost("/{sessionId}/messages/export-batch", async (
            string sessionId,
            [FromQuery] string? format,
            [FromBody] BatchExportRequest request,
            PstService pstService,
            LicenseApiClient licenseClient,
            ClaimsPrincipal user,
            ILogger<Program> logger) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? userId;

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("BatchExportMessages request: session={SessionId}, format={Format}, count={Count}", sessionId, format, request.EntryIds?.Count ?? 0);
            }

            if (request.EntryIds == null || request.EntryIds.Count == 0)
            {
                return Results.BadRequest(new { error = "No messages selected for export" });
            }

            try
            {
                var toolStatus = await licenseClient.GetLicenceStatus(userEmail);
                if (toolStatus == LicenseTier.DemoExpired)
                {
                    return Results.Json(new { error = toolStatus }, statusCode: StatusCodes.Status403Forbidden);
                }
                var moduleStatus = await LicenseApiClient.GetModuleVersion();
                if (toolStatus == LicenseTier.Professional && moduleStatus != ModuleLicenseType.Active)
                {
                    return Results.Json(new { error = moduleStatus }, statusCode: StatusCodes.Status403Forbidden);
                }

                var exportFormat = ExportFormatHelpers.Parse(format);
                var (filePath, isReady) = await pstService.ExportAllAsync(
                    sessionId, 
                    userId, 
                    exportFormat,
                    toolStatus == LicenseTier.Demo,
                    entryIds: request.EntryIds);

                if (!isReady)
                {
                    return Results.Accepted();
                }

                return Results.File(filePath, "application/zip", "selected_messages_export.zip");
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("BatchExportMessages: Unauthorized for session {SessionId}", sessionId);
                return Results.Forbid();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "BatchExportMessages failed for session {SessionId}", sessionId);
                return Results.Problem(ex.Message);
            }
        })
        .WithName("BatchExportMessages")
        .WithTags("Message Operations")
        .RequireAuthorization();
    }
}

public record BatchExportRequest(List<string> EntryIds);
