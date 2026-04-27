using System;
using System.Text.Json.Serialization;

namespace PstConverter.Models
{
    public enum LicenseTier
    {
        Demo = 1,
        DemoExpired = 2,
        Professional = 3
    }

    public enum ModuleLicenseType
    {
        Active = 1,
        Expired = 2,
        Cancelled = 3,
        NotSubscribed = 4
    }

    public enum Tool
    {
        ConvertOSTToPST = 1
    }

    public enum Module
    {
        ConvertOSTToPST = 1
    }

    public class ConvertStringEnum
    {
        public LicenseTier ConvertStringToLicenseTier(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return LicenseTier.DemoExpired;

            string normalized = str.Trim().Trim('"');

            if (normalized.Equals("Professional", StringComparison.OrdinalIgnoreCase) ||
                normalized.Equals("Active", StringComparison.OrdinalIgnoreCase) ||
                normalized.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                return LicenseTier.Professional;
            }
            else if (normalized.Equals("Demo", StringComparison.OrdinalIgnoreCase))
            {
                return LicenseTier.Demo;
            }
            else if (normalized.Equals("DemoExpired", StringComparison.OrdinalIgnoreCase) ||
                     normalized.Equals("Expired", StringComparison.OrdinalIgnoreCase) ||
                     normalized.Equals("false", StringComparison.OrdinalIgnoreCase))
            {
                return LicenseTier.DemoExpired;
            }
            return LicenseTier.DemoExpired;
        }

        public ModuleLicenseType ConvertStringToModuleLicenseType(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return ModuleLicenseType.NotSubscribed;

            string normalized = str.Trim().Trim('"');

            if (normalized.Equals("Active", StringComparison.OrdinalIgnoreCase))
                return ModuleLicenseType.Active;
            else if (normalized.Equals("Expired", StringComparison.OrdinalIgnoreCase))
                return ModuleLicenseType.Expired;
            else if (normalized.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                return ModuleLicenseType.Cancelled;

            return ModuleLicenseType.NotSubscribed;
        }
    }

    public class AllConstants
    {
        public static int DemoExportLimit { get; } = 50;
        public static long MaxUploadSize { get; } = 5368709120L; // 5 GB
        public static long DemoMaxUploadSize { get; } = 524288000L; // 500 MB
    }

    public class LicenseToken(string token)
    {
        public string Token { get; } = token;
        public DateTime CreatedAt { get; } = DateTime.Now;
        public bool IsExpired => DateTime.Now >= CreatedAt.AddMinutes(50);
    }

    public class LoginRequest
    {
        public string ToolId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
    }

    public class SubscriptionRequest
    {
        public int TotalItems { get; set; }
        public long Storage { get; set; }
        public int TotalDays { get; set; }
        public int ModuleId { get; set; }
    }

    public class SubscriptionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? RawResponse { get; set; }
        // public DetailedLicenseStatus? AllottedData { get; set; }
    }

    public class DetailedLicenseStatus
    {
        //  public int ModuleId { get; set; }
        public LicenseTier Tier { get; set; }
        public bool CanConvert { get; set; }
        public int ExportFileLimit { get; set; }
        [JsonIgnore] public int TotalItemsAllotted { get; set; }
        [JsonIgnore] public int TotalItemsUsed { get; set; }
        [JsonIgnore] public long TotalStorageAllotted { get; set; }
        [JsonIgnore] public long TotalStorageUsed { get; set; }
        [JsonIgnore] public int TotalDaysAllotted { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool HitTimePeriodLimit { get; set; }
        public bool HitSizeLimit { get; set; }
        public bool HitFileCountLimit { get; set; }
        public bool IsUsageRestricted => HitTimePeriodLimit || HitSizeLimit || HitFileCountLimit;
    }

    // The license server uses short property names (TotalItems, Storage, TotalDays)
    public class LicenseServerQuota
    {
        [JsonPropertyName("TotalItems")]
        public string? TotalItems { get; set; }

        [JsonPropertyName("Storage")]
        public string? Storage { get; set; }

        [JsonPropertyName("TotalDays")]
        public string? TotalDays { get; set; }

        [JsonPropertyName("ModuleId")]
        public string? ModuleId { get; set; }

        // [JsonPropertyName("PlanId")]
        // public string? PlanId { get; set; }
    }
}
