namespace PstConverter.Models;

//this is for the chunked upload metadata
public class ChunkedUploadMetadata
{
    public string UploadId { get; set; } = "";
    public string OriginalFileName { get; set; } = "";
    public string UserId { get; set; } = "";
    public int TotalChunks { get; set; }
    public long TotalSize { get; set; }
    public List<int> ReceivedChunks { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
