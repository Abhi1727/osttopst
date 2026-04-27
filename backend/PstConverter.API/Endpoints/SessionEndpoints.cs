using PstConverter.Models;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PstConverter.Extensions;

namespace PstConverter.Endpoints;

public static class SessionEndpoints
{
    /// <summary>
    /// Extension method to map session-related API endpoints (recent sessions, duplicate check, status check, cancellation, and deletion).
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var groupAuth = app.MapGroup("/api/sessions").RequireAuthorization();
        var groupPublic = app.MapGroup("/api/sessions");
        
        //this is for getting the recent sessions for the user
        groupAuth.MapGet("/recent", async (AppDbContext db, ClaimsPrincipal user, IConfiguration config) =>
        {
            var userId = user.GetInternalUserId();
            // Get last 10 successful sessions for this user, filtering out Viewer sessions
            var sessions = await db.ConversionSessions
                .Where(s => s.UserId == userId && s.Purpose != "Viewer")
                .OrderByDescending(s => s.CreatedAt)
                .Take(10)
                .ToListAsync();

            // Filter to only include sessions that have actual files on disk or are in a "Ready" state
            var validSessions = sessions.Where(s =>
            {
                var pstExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{s.SessionId}.pst"));
                var ostExists = File.Exists(Path.Combine(StorageConstants.UploadDir, $"{s.SessionId}.ost"));
                var isReady = (s.Status ?? "").StartsWith("Ready", StringComparison.OrdinalIgnoreCase);
                
                // Include session if files exist on disk OR if it's marked as Ready (conversion/export complete)
                return pstExists || ostExists || isReady;
            }).ToList();

            return Results.Ok(validSessions.Select(s => new
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
        groupAuth.MapGet("/duplicate-check", async (string fingerprint, AppDbContext db, ClaimsPrincipal user, IConfiguration config) =>
        {
            var userId = user.GetInternalUserId();
            var cutoff = DateTime.Now.AddHours(-24);
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
        groupPublic.MapGet("/{sessionId}/check", async (string sessionId, AppDbContext db, LicenseApiClient licenseClient, ClaimsPrincipal user, IConfiguration config, HttpContext httpContext) =>
        {
            var userId = user.GetInternalUserId();
            
            // For authenticated users, check ownership. For anonymous users, allow access to any sessionId
            // (they have it from the upload response and can't be verified anyway)
            var isAnonymous = userId == "unauthenticated";
            
            var session = isAnonymous
                ? await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId)
                : await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
            {
                var logger = httpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("SessionEndpoints");
                
                // DIAGNOSTIC CORE: If session not found for user, check if it exists AT ALL
                var rawSession = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
                if (rawSession != null)
                {
                    logger.LogWarning("[OWNERSHIP MISMATCH] Session {SessionId} exists but belongs to '{OwnerId}'. Request user is '{RequestId}'. isAnonymous={IsAnonymous}", 
                        sessionId, rawSession.UserId, userId, isAnonymous);
                }
                else
                {
                    logger.LogWarning("[SESSION NOT FOUND] Session {SessionId} does not exist in DB at all. userId={UserId}, isAnonymous={IsAnonymous}", 
                        sessionId, userId, isAnonymous);
                }
                
                return Results.NotFound();
            }



            // If this session was marked as a duplicate after background assembly, return the original session instead.
            if (session.Status == "Duplicate" && !string.IsNullOrEmpty(session.StoreGuid))
            {
                var cutoff = DateTime.Now.AddHours(-24);
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

            // 3. License check (Only if not ready to save DB hits)
            bool limitHit = false;
            if (!isSessionReady)
            {
                var userEmail = user.GetUserEmailId(null, config["LicenseApi:UserId"]);
                if (userEmail.StartsWith("user_", StringComparison.OrdinalIgnoreCase) && session != null && !string.IsNullOrEmpty(session.Email) && !session.Email.StartsWith("user_", StringComparison.OrdinalIgnoreCase))
                {
                    userEmail = session.Email;
                }

                var itemName = session?.OriginalFileName != null ? $"{session.OriginalFileName}{session.Size}" : sessionId;
                var licenseStatus = await licenseClient.GetDetailedLicenseStatusAsync(userEmail);
                limitHit = licenseStatus.HitFileCountLimit || licenseStatus.HitSizeLimit || licenseStatus.HitTimePeriodLimit;

                if (limitHit && session != null && session.Status != "Ready")
                {
                    session.Status = "LimitReached";
                    // Save immediately on status change
                    await db.SaveChangesAsync();
                }
            }

            // Rate-limit LastAccessedAt updates to once per 5 minutes to further reduce DB noise
            if (session != null && (DateTime.Now - session.LastAccessedAt).TotalMinutes > 5)
            {
                session.LastAccessedAt = DateTime.Now;
                try { await db.SaveChangesAsync(); } catch { }
            }

            return Results.Ok(new
            {
                sessionId = session!.SessionId,
                originalFileName = session.OriginalFileName,
                status = session.Status,
                exists = pstExists || ostExists || isSessionReady,
                isConverted = isSessionReady,
                size = session.Size,
                fileType = session.FileType,
                createdAt = session.CreatedAt,
                storeGuid = session.StoreGuid,
                errorMessage = session.ErrorMessage,
                splitFiles = string.IsNullOrEmpty(session.SplitFilesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(session.SplitFilesJson)
            });
        });
        //this is for deleting a specific session
        groupAuth.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, AppDbContext db, ClaimsPrincipal user, IConfiguration config) =>
        {
            var userId = user.GetInternalUserId();
            var session = await db.ConversionSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session != null)
            {
                try
                {
                    await pstService.CleanUpAsync(sessionId);
                    db.ConversionSessions.Remove(session);
                    await db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SessionEndpoints] Error deleting individual session {sessionId}: {ex.Message}");
                    try { db.ConversionSessions.Remove(session); await db.SaveChangesAsync(); } catch { }
                }
            }

            return Results.NoContent();
        });

        //this is for deleting all sessions for the user
        groupAuth.MapDelete("/all", async (PstService pstService, AppDbContext db, ClaimsPrincipal user, IConfiguration config) =>
        {
            var userId = user.GetInternalUserId();
            var sessions = await db.ConversionSessions
                .Where(s => s.UserId == userId)
                .ToListAsync();

            foreach (var session in sessions)
            {
                try
                {
                    await pstService.CleanUpAsync(session.SessionId);
                    db.ConversionSessions.Remove(session);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SessionEndpoints] Error cleaning up session {session.SessionId} during bulk delete: {ex.Message}");
                    try { db.ConversionSessions.Remove(session); } catch { }
                }
            }

            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        //this is for cancelling the session
        groupAuth.MapPost("/{sessionId}/cancel", async (string sessionId, PstService pstService, ClaimsPrincipal user, IConfiguration config) =>
        {
            var userId = user.GetInternalUserId();
            // We verify ownership by having PstService check the session inside its cancel logic if needed,
            // but for simplicity here we just call it.
            await pstService.CancelBackgroundTaskAsync(sessionId);
            return Results.Ok(new { message = "Cancellation request processed" });
        });
    }
}
