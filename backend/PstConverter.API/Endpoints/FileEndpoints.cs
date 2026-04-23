using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PstConverter.Services;
using PstConverter.Models;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using PstConverter.Extensions;

namespace PstConverter.Endpoints;

public static class FileEndpoints
{
    public static void MapFileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/file-details");

        group.MapGet("/diag/claims", (ClaimsPrincipal user) =>
        {
            return Results.Ok(user.Claims.Select(c => new { c.Type, c.Value }));
        }).RequireAuthorization();

        group.MapGet("/diag/licenses", async (PstConverter.Data.AppDbContext db) =>
        {
            var licenses = await db.MockLicenses.ToListAsync();
            return Results.Ok(licenses);
        }).AllowAnonymous();

        // ======== DELETE SESSION ========
        group.MapDelete("/{sessionId}", async (string sessionId, PstService pstService, ClaimsPrincipal user, IConfiguration config, AppDbContext db, ILogger<Program> logger) =>
        {
            try 
            {
                var userId = user.GetInternalUserId();
                var session = await db.ConversionSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

                if (session == null) return Results.NotFound();

                await pstService.CleanUpAsync(sessionId);
                db.ConversionSessions.Remove(session);
                await db.SaveChangesAsync();

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to delete session {SessionId}", sessionId);
                return Results.Problem("Failed to delete session");
            }
        })
        .WithName("DeleteSession")
        .WithTags("File Operations")
        .RequireAuthorization();
    }

    /// <summary>
    /// Validates if a given stream has a valid Outlook data file (!BDN) signature.
    /// </summary>
    public static bool IsValidOutlookDataFile(Stream stream, string expectedExtension)
    {
        if (stream.Length < 12) return false;

        var start = stream.Position;
        var buffer = new byte[12];
        var read = stream.Read(buffer, 0, 12);
        stream.Position = start;

        // Check the 4-byte magic word (!BDN)
        if (read < 12 || buffer[0] != 0x21 || buffer[1] != 0x42 || buffer[2] != 0x44 || buffer[3] != 0x4E)
        {
            return false;
        }

        return true;
    }
}