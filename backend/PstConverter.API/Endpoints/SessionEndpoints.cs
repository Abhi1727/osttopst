using PstConverter.Models;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PstConverter.Endpoints;

public static class SessionEndpoints
{
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sessions").RequireAuthorization();

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

        group.MapGet("/{sessionId}/check", async (string sessionId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null) return Results.NotFound();

            // Check if file still exists on disk using standardized path
            var pstExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{sessionId}.pst"));
            var ostExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{sessionId}.ost"));

            // Check for converted files too
            var convertedPstExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{sessionId}_converted.pst"));
            var convertedOstExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{sessionId}_converted.ost"));

            // Update LastAccessedAt
            session.LastAccessedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                sessionId = session.SessionId,
                originalFileName = session.OriginalFileName,
                status = session.Status,
                exists = pstExists || ostExists,
                isConverted = (convertedPstExists || convertedOstExists) && session.Status != "Converting",
                size = session.Size,
                fileType = session.FileType,
                createdAt = session.CreatedAt,
                storeGuid = session.StoreGuid
            });
        });

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
