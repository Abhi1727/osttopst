namespace PstConverter.Models;

public class PstMessageDetail
{
    public string EntryId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Cc { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string BodyHtml { get; set; } = string.Empty;
    public string BodyText { get; set; } = string.Empty;
    public List<AttachmentInfo> Attachments { get; set; } = [];
}

public class AttachmentInfo
{
    public string FileName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string ContentType { get; set; } = string.Empty;
}
