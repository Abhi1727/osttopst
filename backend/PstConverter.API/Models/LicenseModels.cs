using System;
using System.Reflection.Metadata;

namespace PstConverter.Models
{
    //this is for license request parameters
    public class LicenseRequestParameters
    {
        public string? UserId { get; set; }
        public string? ToolId { get; set; }
        public string? ModuleId { get; set; }
        public string? ItemId { get; set; }
    }

    //THIS IS FOR LICENSE TIER
    public enum LicenseTier
    {
        Demo = 1,
        DemoExpired = 2,
        Professional = 3
    }

    //THIS IS FOR MODULE LICENSE TYPE
    public enum ModuleLicenseType
    {
        Active = 1,
        Expired = 2,
        Cancelled = 3,
        NotSubscribed = 4
    }

    //THIS IS FOR TOOL
    public enum Tool{
        ConvertOSTToPST = 1
    }
    //THIS IS FOR MODULE
    public enum Module
    {
        ConvertOSTToPST = 1
    }
    // public enum LicenseResponseStatus
    // {
    //     Professional,
    //     Demo,
    //     DemoExpired,
    //     Cancelled,
    //     Active,
    //     Expired,
    //     NotSubscribed
    // }

    //THIS IS FOR CONVERT STRING TO ENUM
    public class ConvertStringEnum
    {
        public LicenseTier ConvertStringToLicenseTier(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return LicenseTier.DemoExpired;

            string normalized = str.Trim().Trim('"');

            if (normalized.Equals("Professional", StringComparison.OrdinalIgnoreCase))
            {
                return LicenseTier.Professional;
            }
            else if (normalized.Equals("Demo", StringComparison.OrdinalIgnoreCase))
            {
                return LicenseTier.Demo;
            }
            return LicenseTier.DemoExpired;
        }
        public ModuleLicenseType ConvertStringToModuleLicenseType(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return ModuleLicenseType.NotSubscribed;

            string normalized = str.Trim().Trim('"');

            if (normalized.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                return ModuleLicenseType.Active;
            }
            else if (normalized.Equals("Expired", StringComparison.OrdinalIgnoreCase))
            {
                return ModuleLicenseType.Expired;
            }
            else if (normalized.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return ModuleLicenseType.Cancelled;
            }
            return ModuleLicenseType.NotSubscribed;
        }
    }

    public class AllConstants
    {
        public static int DemoExportLimit {get;}=50;
    }
    // public class LicenseStatus : IComparable<LicenseStatus>
    // {
    //     public LicenseTier Tier { get; set; }
    //     public ModuleLicenseType Status { get; set; }
    //     //public LicenseResponseStatus StatusValue { get; set; }
    //     //public DateTime CreationDate { get; set; }
    //     public int ExportFileLimit { get; set; }
    //     public bool CanConvert { get; set; }
    //     //public long TotalStorage { get; set; } = 0;
    //     //public long UsedStorage { get; set; } = 0;
    //     //public long RemainingStorage => Math.Max(0, TotalStorage - UsedStorage);
    //     //public string Message { get; set; } = string.Empty;

    //     // public int CompareTo(LicenseStatus? other) => CompareProfessional(other!);

    //     // /// <summary>
    //     // /// Compares this license status with another according to "Professional Logic":
    //     // /// Professional > DemoExpired > Demo (if DemoExpired is being treated as higher priority for some reason, 
    //     // /// but usually Active > Expired). Let's stick to the logic: Professional > Demo, AND Active > Expired.
    //     // /// </summary>
    //     // public int CompareProfessional(LicenseStatus other)
    //     // {
    //     //     if (other == null) return 1;

    //     //     // Tier priority: Professional (2) > Demo/DemoExpired (1/0)
    //     //     int thisTierRank = GetTierRank(this.Tier);
    //     //     int otherTierRank = GetTierRank(other.Tier);

    //     //     if (thisTierRank != otherTierRank)
    //     //     {
    //     //         return thisTierRank.CompareTo(otherTierRank);
    //     //     }

    //     //     // Status priority: Active (4) > Expired (3) > Cancelled (2) > NotSubscribed (1)
    //     //     int thisStatusRank = GetStatusRank(this.Status);
    //     //     int otherStatusRank = GetStatusRank(other.Status);

    //     //     return thisStatusRank.CompareTo(otherStatusRank);
    //     // }

    //     // private static int GetTierRank(LicenseTier tier) => tier switch
    //     // {
    //     //     LicenseTier.Professional => 2,
    //     //     LicenseTier.Demo => 1,
    //     //     LicenseTier.DemoExpired => 0,
    //     //     _ => 0
    //     // };

    //     // private static int GetStatusRank(ModuleLicenseType status) => status switch
    //     // {
    //     //     ModuleLicenseType.Active => 1,
    //     //     ModuleLicenseType.Expired => 2,
    //     //     ModuleLicenseType.Cancelled => 3,
    //     //     ModuleLicenseType.NotSubscribed => 4,
    //     //     _ => 0
    //     // };

    //     // public static LicenseStatus Parse(string backendResponse)
    //     // {
    //     //     if (string.IsNullOrWhiteSpace(backendResponse))
    //     //     {
    //     //         return new LicenseStatus()
    //     //         {
    //     //             Tier = LicenseTier.DemoExpired,
    //     //             Status = ModuleLicenseType.NotSubscribed,
    //     //             StatusValue = ModuleLicenseType.NotSubscribed,
    //     //             CanConvert = false,
    //     //             Message = "No response from license server."
    //     //         };
    //     //     }

    //     //     // Normalize for comparison
    //     //     string raw = backendResponse.Trim().ToLowerInvariant().Replace("\"", "");

    //     //     if (raw.Contains("professional"))
    //     //     {
    //     //         var s = CreateProfessional();
    //     //         s.StatusValue = LicenseTier.Professional;
    //     //         if (raw.Contains("expired"))
    //     //         {
    //     //             s.Status = ModuleLicenseType.Expired;
    //     //             s.StatusValue = LicenseResponseStatus.Expired;
    //     //         }
    //     //         else if (raw.Contains("cancelled"))
    //     //         {
    //     //             s.Status = ModuleLicenseType.Cancelled;
    //     //             s.StatusValue = LicenseResponseStatus.Cancelled;
    //     //         }
    //     //         else
    //     //         {
    //     //             s.Status = ModuleLicenseType.Active;
    //     //             s.StatusValue = LicenseResponseStatus.Active;
    //     //         }
    //     //         return s;
    //     //     }

    //     //     if (raw.Contains("demoexpired"))
    //     //     {
    //     //         return new LicenseStatus
    //     //         {
    //     //             Tier = LicenseTier.DemoExpired,
    //     //             StatusValue = LicenseResponseStatus.DemoExpired,
    //     //             Status = ModuleLicenseType.Expired,
    //     //             CanConvert = false,
    //     //             ExportFileLimit = 0,
    //     //             Message = "License expired. Please purchase a professional plan."
    //     //         };
    //     //     }

    //     //     if (raw.Contains("demo"))
    //     //     {
    //     //         return new LicenseStatus
    //     //         {
    //     //             Tier = LicenseTier.Demo,
    //     //             StatusValue = LicenseResponseStatus.Demo,
    //     //             Status = ModuleLicenseType.Active,
    //     //             CanConvert = true,
    //     //             ExportFileLimit = 50,
    //     //             Message = "Demo license active (limit 50 items)."
    //     //         };
    //     //     }

    //     //     if (raw.Contains("cancelled"))
    //     //     {
    //     //         return new LicenseStatus
    //     //         {
    //     //             Tier = LicenseTier.DemoExpired,
    //     //             StatusValue = LicenseResponseStatus.Cancelled,
    //     //             Status = ModuleLicenseType.Cancelled,
    //     //             CanConvert = false,
    //     //             Message = "License has been cancelled."
    //     //         };
    //     //     }

    //     //     if (raw.Contains("expired"))
    //     //     {
    //     //         return new LicenseStatus
    //     //         {
    //     //             Tier = LicenseTier.DemoExpired,
    //     //             StatusValue = LicenseResponseStatus.Expired,
    //     //             Status = ModuleLicenseType.Expired,
    //     //             CanConvert = false,
    //     //             Message = "License is expired."
    //     //         };
    //     //     }

    //     //     return new LicenseStatus
    //     //     {
    //     //         Tier = LicenseTier.DemoExpired,
    //     //         StatusValue = LicenseResponseStatus.NotSubscribed,
    //     //         Status = ModuleLicenseType.NotSubscribed,
    //     //         CanConvert = false,
    //     //         Message = $"Unknown license status received: {backendResponse}"
    //     //     };
    //     // }



    //     // public static LicenseStatus CreateDemo(DateTime creationDate)
    //     // {
    //     //     var isExpired = DateTime.UtcNow > creationDate.AddDays(7);
    //     //     return new LicenseStatus
    //     //     {
    //     //         Tier = isExpired ? LicenseTier.DemoExpired : LicenseTier.Demo,
    //     //         StatusValue = isExpired ? LicenseResponseStatus.DemoExpired : LicenseResponseStatus.Demo,
    //     //         Status = isExpired ? ModuleLicenseType.Expired : ModuleLicenseType.Active,
    //     //         CreationDate = creationDate,
    //     //         ExportFileLimit = isExpired ? 0 : 50,
    //     //         CanConvert = !isExpired,
    //     //         Message = isExpired ? "Demo expired. Please purchase a plan." : "7-day free trial active (50 files per folder limit)."
    //     //     };
    //     // }

    //     // public static LicenseStatus CreateProfessional()
    //     // {
    //     //     return new LicenseStatus
    //     //     {
    //     //         Tier = LicenseTier.Professional,
    //     //         StatusValue = LicenseResponseStatus.Professional,
    //     //         Status = ModuleLicenseType.Active,
    //     //         CreationDate = DateTime.MinValue,
    //     //         ExportFileLimit = -1,
    //     //         CanConvert = true,
    //     //         Message = "Professional plan active."
    //     //     };
    //     // }

    // }


    //THIS IS FOR LICENSE TOKEN
    public class LicenseToken(string token)
    {
        public string Token { get; } = token;
        public DateTime CreatedAt { get; } = DateTime.UtcNow;

        public bool IsExpired => DateTime.UtcNow >= CreatedAt.AddMinutes(50);
    }

    //THIS IS FOR LOGIN REQUEST
    public class LoginRequest
    {
        public string ToolId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

    //THIS IS FOR LOGIN RESPONSE
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
    }

    //THIS IS FOR PROFESSIONAL LICENSE ITEM
    public class ProfessionalLicenseItem
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSizeInBytes { get; set; }
        public string ItemId => $"{FileName}{FileSizeInBytes}";
    }

    //THIS IS FOR PROFESSIONAL USAGE LIMITS
    public class ProfessionalUsageLimits
    {
        public bool HitTimePeriodLimit { get; set; }
        public bool HitSizeLimit { get; set; }
        public bool HitFileCountLimit { get; set; }
        public bool IsUsageRestricted => HitTimePeriodLimit || HitSizeLimit || HitFileCountLimit;
    }

    //THIS IS FOR SUBSCRIPTION / PRICING PLAN PURCHASE REQUEST
    public class SubscriptionRequest
    {
        public int TotalItems { get; set; }
        public long Storage { get; set; }
        public int TotalDays { get; set; }
        public int ModuleId { get; set; }
    }

    //THIS IS FOR SUBSCRIPTION RESPONSE RETURNED TO THE FRONTEND
    public class SubscriptionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? RawResponse { get; set; }
        public DetailedLicenseStatus? AllottedData { get; set; }
    }

    //THIS IS FOR DETAILED LICENSE STATUS (used to show plan limits on frontend)
    public class DetailedLicenseStatus
    {
        public LicenseTier Tier { get; set; }
        public bool CanConvert { get; set; }
        public int ExportFileLimit { get; set; }
        public int TotalItemsAllotted { get; set; }
        public int TotalItemsUsed { get; set; }
        public long TotalStorageAllotted { get; set; }
        public long TotalStorageUsed { get; set; }
        public int TotalDaysAllotted { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool HitTimePeriodLimit { get; set; }
        public bool HitSizeLimit { get; set; }
        public bool HitFileCountLimit { get; set; }
        public bool IsUsageRestricted => HitTimePeriodLimit || HitSizeLimit || HitFileCountLimit;
    }
}


