using System.ComponentModel.DataAnnotations;

namespace PstConverter.Models;

    //this is for the conversion session
public class ConversionSession
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string SessionId { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [MaxLength(128)]
    public string Status { get; set; } = "Uploaded";

    [Required]
    public string UserId { get; set; } = string.Empty;

    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;

    public long Size { get; set; }

    [MaxLength(10)]
    public string FileType { get; set; } = string.Empty;

    public string? Password { get; set; }
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? StoreGuid { get; set; }

    public bool IsPaid { get; set; } = false;

    public string? SplitFilesJson { get; set; }
    public string? ErrorMessage { get; set; }
}
