namespace PstConverter.Models;

public class PstFolderInfo
{
    public string FolderId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int MessageCount { get; set; }
    public int TotalMessageCount { get; set; }
    public List<PstFolderInfo> SubFolders { get; set; } = [];
    public string FolderClass { get; set; } = "IPM.Note";
}
