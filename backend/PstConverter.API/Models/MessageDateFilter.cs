namespace PstConverter.Models;

public class MessageDateFilter
{
    public int? Year { get; set; }
    public int? Month { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public bool Matches(DateTime messageDate)
    {
        // If all filters are null, match everything
        if (Year == null && Month == null && StartDate == null && EndDate == null)
            return true;

        // Year filter
        if (Year.HasValue && messageDate.Year != Year.Value)
            return false;

        // Month filter
        if (Month.HasValue && messageDate.Month != Month.Value)
            return false;

        // Date range filter
        if (StartDate.HasValue && messageDate.Date < StartDate.Value.Date)
            return false;

        if (EndDate.HasValue && messageDate.Date > EndDate.Value.Date)
            return false;

        return true;
    }

    public bool IsEmpty()
    {
        return Year == null && Month == null && StartDate == null && EndDate == null;
    }
}
