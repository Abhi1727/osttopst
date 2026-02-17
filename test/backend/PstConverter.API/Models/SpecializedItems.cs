namespace PstConverter.Models;

public class PstContactInfo
{
    public string EntryId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class PstCalendarInfo
{
    public string EntryId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Location { get; set; } = string.Empty;
}
