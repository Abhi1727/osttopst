using Microsoft.EntityFrameworkCore;
using PstConverter.Models;

namespace PstConverter.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{

    public DbSet<ConversionSession> ConversionSessions { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ConversionSession>()
            .HasIndex(s => s.SessionId)
            .IsUnique();
    }
}