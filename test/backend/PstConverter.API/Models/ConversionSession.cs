using System.ComponentModel.DataAnnotations;

namespace PstConverter.Models;

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

    [MaxLength(20)]
    public string Status { get; set; } = "Uploaded";

    [Required]
    public string UserId { get; set; } = string.Empty;

    public long Size { get; set; }

    [MaxLength(10)]
    public string FileType { get; set; } = string.Empty;

    public string? Password { get; set; }
}
