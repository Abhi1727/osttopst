using Microsoft.EntityFrameworkCore;
using PstConverter.Models;

namespace PstConverter.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Ensure database is created
        // Note: For production, we should use context.Database.Migrate()
        // context.Database.EnsureCreated();

        // Migration logic for SQL Server handled by EF Core Migrations
    }
}
