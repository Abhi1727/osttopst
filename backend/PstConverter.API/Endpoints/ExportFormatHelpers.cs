using PstConverter.Models;

namespace PstConverter.Endpoints;

public static class ExportFormatHelpers
{
    public static ExportFormat Parse(string? format)
    {
        return (format?.ToLowerInvariant()) switch
        {
            "eml" => ExportFormat.Eml,
            "msg" => ExportFormat.Msg,
            "html" => ExportFormat.Html,
            "mhtml" => ExportFormat.Mhtml,
            "mbox" => ExportFormat.Mbox,
            _ => ExportFormat.Eml
        };
    }

    public static string GetContentType(this ExportFormat format)
    {
        return format switch
        {
            ExportFormat.Eml => "message/rfc822",
            ExportFormat.Msg => "application/vnd.ms-outlook",
            ExportFormat.Html => "text/html",
            ExportFormat.Mhtml => "message/rfc822",
            ExportFormat.Mbox => "application/mbox",
            _ => "application/octet-stream"
        };
    }

    public static string GetExtension(this ExportFormat format)
    {
        return format switch
        {
            ExportFormat.Eml => ".eml",
            ExportFormat.Msg => ".msg",
            ExportFormat.Html => ".html",
            ExportFormat.Mhtml => ".mhtml",
            ExportFormat.Mbox => ".mbox",
            _ => ".eml"
        };
    }
}
