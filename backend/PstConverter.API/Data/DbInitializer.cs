using Microsoft.EntityFrameworkCore;
using PstConverter.Models;

namespace PstConverter.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Automatically create database and apply migrations
        try
        {
            context.Database.Migrate();
            Console.WriteLine("Database initialization successful.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database initialization failed: {ex.Message}");
            throw;
        }
    }

    public static void ClearAllData(AppDbContext context)
    {
        try
        {
            // 1. Clear DB Tables
            context.Database.ExecuteSqlRaw("DELETE FROM ConversionSessions");
            context.Database.ExecuteSqlRaw("DELETE FROM Reviews");
            context.Database.ExecuteSqlRaw("DELETE FROM MockLicenses");
            
            // 2. Clear Upload Files
            var uploadDir = StorageConstants.UploadDir;
            if (Directory.Exists(uploadDir))
            {
                foreach (var file in Directory.GetFiles(uploadDir))
                {
                    try { File.Delete(file); } catch { }
                }
                foreach (var dir in Directory.GetDirectories(uploadDir))
                {
                    try { Directory.Delete(dir, true); } catch { }
                }
            }

            Console.WriteLine("All user data and files cleared from system.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to clear system: {ex.Message}");
        }
    }
    /// <summary>
    /// Recalculates TotalItemsUsed in MockLicenses based on actual ConversionSession counts.
    /// This fixes corrupted item counts from the old email-counting logic.
    /// </summary>
    public static async Task RecalculateItemsUsedAsync(AppDbContext context, Microsoft.Extensions.Caching.Distributed.IDistributedCache? cache = null)
    {
        try
        {
            var licenses = await context.MockLicenses.ToListAsync();
            foreach (var lic in licenses)
            {
                var sessionCount = await context.ConversionSessions
                    .CountAsync(s => s.UserId.ToLower() == lic.LicenseId.ToLower());
                
                if (lic.TotalItemsUsed != sessionCount)
                {
                    Console.WriteLine($"[REPAIR] Resetting TotalItemsUsed for {lic.LicenseId}: {lic.TotalItemsUsed} -> {sessionCount}");
                    lic.TotalItemsUsed = sessionCount;
                }

                // Also evict the stale cache entry
                if (cache != null)
                {
                    try { await cache.RemoveAsync($"allotted_license_{lic.LicenseId.ToLower()}"); }
                    catch { }
                }
            }
            await context.SaveChangesAsync();
            Console.WriteLine("[REPAIR] Item count recalculation complete.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[REPAIR] Failed to recalculate item counts: {ex.Message}");
        }
    }
}
