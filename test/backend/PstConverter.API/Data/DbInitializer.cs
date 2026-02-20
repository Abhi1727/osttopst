using Microsoft.EntityFrameworkCore;
using PstConverter.Models;

namespace PstConverter.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        // Check if LastAccessedAt column exists in ConversionSessions table
        try
        {
            // This is a raw SQL check that works for MySQL (and likely MariaDB/others)
            // We use a try-catch block to be safe, but the intent is to add the column if it's missing.
            // Since we can't easily "check" column existence in a DB-agnostic way without EF Core migrations (which we are avoiding),
            // we will try to select the column. If it fails, we assume it doesn't exist.

            // Actually, a better way for MySQL specifically:
            // SELECT count(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ConversionSessions' AND COLUMN_NAME = 'LastAccessedAt';

            // However, since we are using EF Core, we can just try to run a command that adds it and catch the exception if it exists?
            // "AddColumnIfNotExists" is not standard SQL.

            // Let's use a safer approach: execute a raw command that checks and adds.
            // Since `ExecuteSqlRaw` sends command to DB, we can write a procedure or just a conditional block if supported.
            // MySQL 8.0+ supports IF in stored procedures, but running a simple block is harder.

            // Simpler approach:
            // 1. Check if column exists by querying information_schema
            // 2. If count == 0, ALTER TABLE

            var checkSql = @"
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'ConversionSessions' 
                AND COLUMN_NAME = 'LastAccessedAt'";

            var count = context.Database.SqlQueryRaw<int>(checkSql).AsEnumerable().FirstOrDefault();

            if (count == 0)
            {
                // Column missing, add it
                var alterSql = "ALTER TABLE ConversionSessions ADD COLUMN LastAccessedAt DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6);";
                context.Database.ExecuteSqlRaw(alterSql);
                Console.WriteLine("Schema Update: Added 'LastAccessedAt' column to 'ConversionSessions' table.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Schema Update Warning: Could not verify or add 'LastAccessedAt' column. Error: {ex.Message}");
            // In development with SQLite or other providers, this might fail, but for MySQL production it should work.
        }
    }
}
