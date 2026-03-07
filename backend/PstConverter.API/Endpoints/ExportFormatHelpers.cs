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
            "pdf" => ExportFormat.Pdf,
            "xps" => ExportFormat.Xps,
            "tiff" => ExportFormat.Tiff,
            "oft" => ExportFormat.Oft,
            "olm" => ExportFormat.Olm,
            "emlx" => ExportFormat.Emlx,
            "doc" => ExportFormat.Doc,
            "docx" => ExportFormat.Docx,
            "txt" => ExportFormat.Txt,
            "rtf" => ExportFormat.Rtf,
            "csv" => ExportFormat.Csv,
            "xml" => ExportFormat.Xml,
            "json" => ExportFormat.Json,
            "vcf" => ExportFormat.Vcf,
            "ics" => ExportFormat.Ics,
            "zip" => ExportFormat.Zip,
            "sevenzip" or "7z" => ExportFormat.SevenZip,
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
            ExportFormat.Pdf => "application/pdf",
            ExportFormat.Xps => "application/oxps",
            ExportFormat.Tiff => "image/tiff",
            ExportFormat.Oft => "application/vnd.ms-outlook",
            ExportFormat.Olm => "application/octet-stream",
            ExportFormat.Emlx => "message/x-emlx",
            ExportFormat.Doc => "application/msword",
            ExportFormat.Docx => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ExportFormat.Txt => "text/plain",
            ExportFormat.Rtf => "application/rtf",
            ExportFormat.Csv => "text/csv",
            ExportFormat.Xml => "application/xml",
            ExportFormat.Json => "application/json",
            ExportFormat.Vcf => "text/vcard",
            ExportFormat.Ics => "text/calendar",
            ExportFormat.Zip => "application/zip",
            ExportFormat.SevenZip => "application/x-7z-compressed",
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
            ExportFormat.Pdf => ".pdf",
            ExportFormat.Xps => ".xps",
            ExportFormat.Tiff => ".tiff",
            ExportFormat.Oft => ".oft",
            ExportFormat.Olm => ".olm",
            ExportFormat.Emlx => ".emlx",
            ExportFormat.Doc => ".doc",
            ExportFormat.Docx => ".docx",
            ExportFormat.Txt => ".txt",
            ExportFormat.Rtf => ".rtf",
            ExportFormat.Csv => ".csv",
            ExportFormat.Xml => ".xml",
            ExportFormat.Json => ".json",
            ExportFormat.Vcf => ".vcf",
            ExportFormat.Ics => ".ics",
            ExportFormat.Zip => ".zip",
            ExportFormat.SevenZip => ".7z",
            _ => ".eml"
        };
    }
}
