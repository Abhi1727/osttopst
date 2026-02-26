using Microsoft.EntityFrameworkCore;
using PstConverter.Models;

namespace PstConverter.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        // Ensure missing columns are added (since we're not using migrations yet)
        AddColumnIfNotExists(context, "ConversionSessions", "LastAccessedAt", "DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6)");
        AddColumnIfNotExists(context, "ConversionSessions", "StoreGuid", "VARCHAR(100) NULL");
        AddColumnIfNotExists(context, "ConversionSessions", "IsPaid", "TINYINT(1) NOT NULL DEFAULT 0");
    }

    private static void AddColumnIfNotExists(AppDbContext context, string tableName, string columnName, string columnDefinition)
    {
        try
        {
            var checkSql = $@"
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = '{tableName}' 
                AND COLUMN_NAME = '{columnName}'";

            var count = context.Database.SqlQueryRaw<long>(checkSql).AsEnumerable().FirstOrDefault();

            if (count == 0)
            {
                var alterSql = $"ALTER TABLE {tableName} ADD COLUMN {columnName} {columnDefinition};";
                context.Database.ExecuteSqlRaw(alterSql);
                Console.WriteLine($"Schema Update: Added '{columnName}' column to '{tableName}' table.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Schema Update Warning: Could not verify or add '{columnName}' column to '{tableName}'. Error: {ex.Message}");
        }
    }
}
