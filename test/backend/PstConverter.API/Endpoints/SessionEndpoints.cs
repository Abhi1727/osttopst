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
                fileType = s.FileType
            }));
        });

        group.MapGet("/{sessionId}/check", async (string sessionId, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null) return Results.NotFound();

            // Check if file still exists on disk
            var uploadDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "PstConverter_Uploads");
            var pstExists = File.Exists(Path.Combine(uploadDir, $"{sessionId}.pst"));
            var ostExists = File.Exists(Path.Combine(uploadDir, $"{sessionId}.ost"));

            return Results.Ok(new
            {
                sessionId = session.SessionId,
                originalFileName = session.OriginalFileName,
                status = session.Status,
                exists = pstExists || ostExists,
                size = session.Size,
                fileType = session.FileType,
                createdAt = session.CreatedAt
            });
        });

        group.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, AppDbContext db, ClaimsPrincipal user) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session != null)
            {
                pstService.CleanUp(sessionId);
                db.ConversionSessions.Remove(session);
                await db.SaveChangesAsync();
            }

            return Results.NoContent();
        });
    }
}
