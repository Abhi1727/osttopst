using System;

namespace PstConverter.Models
{
    public class LicenseRequestParameters
    {
        public string? UserId { get; set; }
        public string? ToolId { get; set; }
        public string? ModuleId { get; set; }
        public string? ItemId { get; set; }
    }

    public enum LicenseTier
    {
        Demo,
        DemoExpired,
        Professional
    }

    public enum LicenseStatusType
    {
        Active,
        Expired,
        Cancelled,
        NotSubscribed
    }

    public class LicenseStatus : IComparable<LicenseStatus>
    {
        public LicenseTier Tier { get; set; }
        public LicenseStatusType Status { get; set; }
        public DateTime CreationDate { get; set; }
        public int ExportFileLimit { get; set; }
        public bool CanConvert { get; set; }
        public long TotalStorage { get; set; } = 0;
        public long UsedStorage { get; set; } = 0;
        public long RemainingStorage => Math.Max(0, TotalStorage - UsedStorage);
        public string Message { get; set; } = string.Empty;

        public int CompareTo(LicenseStatus? other) => CompareProfessional(other!);

        /// <summary>
        /// Compares this license status with another according to "Professional Logic":
        /// Professional > DemoExpired > Demo (if DemoExpired is being treated as higher priority for some reason, 
        /// but usually Active > Expired). Let's stick to the logic: Professional > Demo, AND Active > Expired.
        /// </summary>
        public int CompareProfessional(LicenseStatus other)
        {
            if (other == null) return 1;

            // Tier priority: Professional (2) > Demo/DemoExpired (1/0)
            int thisTierRank = GetTierRank(this.Tier);
            int otherTierRank = GetTierRank(other.Tier);

            if (thisTierRank != otherTierRank)
            {
                return thisTierRank.CompareTo(otherTierRank);
            }

            // Status priority: Active (4) > Expired (3) > Cancelled (2) > NotSubscribed (1)
            int thisStatusRank = GetStatusRank(this.Status);
            int otherStatusRank = GetStatusRank(other.Status);

            return thisStatusRank.CompareTo(otherStatusRank);
        }

        private static int GetTierRank(LicenseTier tier) => tier switch
        {
            LicenseTier.Professional => 2,
            LicenseTier.Demo => 1,
            LicenseTier.DemoExpired => 0,
            _ => 0
        };

        private static int GetStatusRank(LicenseStatusType status) => status switch
        {
            LicenseStatusType.Active => 4,
            LicenseStatusType.Expired => 3,
            LicenseStatusType.Cancelled => 2,
            LicenseStatusType.NotSubscribed => 1,
            _ => 0
        };

        public static LicenseStatus Parse(string backendResponse)
        {
            if (string.IsNullOrWhiteSpace(backendResponse))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    Status = LicenseStatusType.NotSubscribed,
                    CanConvert = false,
                    Message = "No response from license server."
                };
            }

            // Normalize for comparison
            string raw = backendResponse.Trim().ToLowerInvariant().Replace("\"", "");

            if (raw.Contains("professional"))
            {
                var s = CreateProfessional();
                if (raw.Contains("expired")) s.Status = LicenseStatusType.Expired;
                else if (raw.Contains("cancelled")) s.Status = LicenseStatusType.Cancelled;
                else s.Status = LicenseStatusType.Active;
                return s;
            }

            if (raw.Contains("demoexpired"))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    Status = LicenseStatusType.Expired,
                    CanConvert = false,
                    ExportFileLimit = 0,
                    Message = "License expired. Please purchase a professional plan."
                };
            }

            if (raw.Contains("demo"))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.Demo,
                    Status = LicenseStatusType.Active,
                    CanConvert = true,
                    ExportFileLimit = 50,
                    Message = "Demo license active (limit 50 items)."
                };
            }

            if (raw.Contains("cancelled"))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    Status = LicenseStatusType.Cancelled,
                    CanConvert = false,
                    Message = "License has been cancelled."
                };
            }

            return new LicenseStatus
            {
                Tier = LicenseTier.DemoExpired,
                Status = LicenseStatusType.NotSubscribed,
                CanConvert = false,
                Message = $"Unknown license status received: {backendResponse}"
            };
        }


        public static LicenseStatus CreateDemo(DateTime creationDate)
        {
            var isExpired = DateTime.UtcNow > creationDate.AddDays(7);
            return new LicenseStatus
            {
                Tier = isExpired ? LicenseTier.DemoExpired : LicenseTier.Demo,
                Status = isExpired ? LicenseStatusType.Expired : LicenseStatusType.Active,
                CreationDate = creationDate,
                ExportFileLimit = isExpired ? 0 : 50,
                CanConvert = !isExpired,
                Message = isExpired ? "Demo expired. Please purchase a plan." : "7-day free trial active (50 files per folder limit)."
            };
        }

        public static LicenseStatus CreateProfessional()
        {
            return new LicenseStatus
            {
                Tier = LicenseTier.Professional,
                Status = LicenseStatusType.Active,
                CreationDate = DateTime.MinValue,
                ExportFileLimit = -1,
                CanConvert = true,
                Message = "Professional plan active."
            };
        }
    }


    public class LicenseToken(string token)
    {
        public string Token { get; } = token;
        public DateTime CreatedAt { get; } = DateTime.UtcNow;

        public bool IsExpired => DateTime.UtcNow >= CreatedAt.AddMinutes(50);
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

    public class ProfessionalLicenseItem
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSizeInBytes { get; set; }
        public string ItemId => $"{FileName}{FileSizeInBytes}";
    }

    public class ProfessionalUsageLimits
    {
        public bool HitTimePeriodLimit { get; set; }
        public bool HitSizeLimit { get; set; }
        public bool HitFileCountLimit { get; set; }
        public bool IsUsageRestricted => HitTimePeriodLimit || HitSizeLimit || HitFileCountLimit;
    }
}
