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
}

