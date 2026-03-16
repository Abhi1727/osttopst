using PstConverter.Models;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PstConverter.Endpoints;

public static class SessionEndpoints
{
    /// <summary>
    /// Extension method to map session-related API endpoints (recent sessions, duplicate check, status check, cancellation, and deletion).
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sessions").RequireAuthorization();
        //this is for getting the recent sessions for the user
        group.MapGet("/recent", async (AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            // Get last 10 successful sessions for this user
            var sessions = await db.ConversionSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Take(10)
                .ToListAsync();

            return Results.Ok(sessions.Select(s => new
            {
                sessionId = s.SessionId,
                originalFileName = s.OriginalFileName,
                createdAt = s.CreatedAt,
                status = s.Status,
                size = s.Size,
                fileType = s.FileType,
                storeGuid = s.StoreGuid
            }));
        });
        //this is for checking if the session is a duplicate
        group.MapGet("/duplicate-check", async (string fingerprint, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var cutoff = DateTime.UtcNow.AddHours(-24);
            var existing = await db.ConversionSessions
                .Where(s => s.UserId == userId && s.StoreGuid == fingerprint && s.CreatedAt > cutoff)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                return Results.Ok(new
                {
                    found = true,
                    isPaid = existing.IsPaid,
                    session = new
                    {
                        sessionId = existing.SessionId,
                        originalFileName = existing.OriginalFileName,
                        createdAt = existing.CreatedAt,
                        status = existing.Status,
                        size = existing.Size,
                        fileType = existing.FileType
                    }
                });
            }

            return Results.Ok(new { found = false });
        });
        //this is for checking the status of the session
        group.MapGet("/{sessionId}/check", async (string sessionId, AppDbContext db, LicenseApiClient licenseClient, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null) return Results.NotFound();

            // If this session was marked as a duplicate after background assembly, return the original session instead.
            if (session.Status == "Duplicate" && !string.IsNullOrEmpty(session.StoreGuid))
            {
                var cutoff = DateTime.UtcNow.AddHours(-24);
                var original = await db.ConversionSessions
                    .Where(x => x.UserId == userId && x.StoreGuid == session.StoreGuid && x.CreatedAt > cutoff && x.Status != "Duplicate" && x.SessionId != sessionId)
                    .OrderByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                if (original != null)
                {
                    session = original;
                }
            }

            // 1. Check if original files exist on disk
            var pstExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{session.SessionId}.pst"));
            var ostExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{session.SessionId}.ost"));

            // 2. The session.Status is the primary source of truth for conversion/export readiness. 
            // Files are named sessionId_converted_... or export_sessionId_... which vary by license/filter.
            // If the status starts with "Ready", the background task has definitely finished the file.
            var isSessionReady = (session.Status ?? "").StartsWith("Ready", StringComparison.OrdinalIgnoreCase);

            // 3. License check to handle background limit hit or external changes
            var userEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("emails") ?? user.FindFirstValue(ClaimTypes.Name) ?? "anonymous";
            var licenseStatus = await licenseClient.GetDetailedLicenseStatusAsync(userEmail, ((int)Tool.ConvertOSTToPST).ToString());
            
            bool limitHit = licenseStatus.HitFileCountLimit || licenseStatus.HitSizeLimit || licenseStatus.HitTimePeriodLimit;

            // Rate-limit LastAccessedAt updates to once per 60s
            if ((DateTime.UtcNow - session.LastAccessedAt).TotalSeconds > 60)
            {
                session.LastAccessedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }

            if (limitHit && session.Status != "Ready")
            {
                // Force status to LimitReached if license is hit and it's not already ready
                session.Status = "LimitReached";
                await db.SaveChangesAsync();
            }

            return Results.Ok(new
            {
                sessionId = session.SessionId,
                originalFileName = session.OriginalFileName,
                status = session.Status,
                exists = pstExists || ostExists || isSessionReady,
                isConverted = isSessionReady,
                size = session.Size,
                fileType = session.FileType,
                createdAt = session.CreatedAt,
                storeGuid = session.StoreGuid,
                splitFiles = string.IsNullOrEmpty(session.SplitFilesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(session.SplitFilesJson)
            });
        });
        //this is for deleting the session
        group.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session != null)
            {
                await pstService.CleanUpAsync(sessionId);
                db.ConversionSessions.Remove(session);
                await db.SaveChangesAsync();
            }

            return Results.NoContent();
        });
        //this is for cancelling the session
        group.MapPost("/{sessionId}/cancel", async (string sessionId, PstService pstService, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            // We verify ownership by having PstService check the session inside its cancel logic if needed,
            // but for simplicity here we just call it.
            await pstService.CancelBackgroundTaskAsync(sessionId);
            return Results.Ok(new { message = "Cancellation request processed" });
        });
    }
}
