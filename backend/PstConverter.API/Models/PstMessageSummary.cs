namespace PstConverter.Models;

public class PstMessageSummary
{
    public string EntryId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public long Size { get; set; }
    public bool HasAttachments { get; set; }
}
