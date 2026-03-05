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

    public class LicenseStatus
    {
        public LicenseTier Tier { get; set; }
        public DateTime CreationDate { get; set; }
        public int ExportFileLimit { get; set; }
        public bool CanConvert { get; set; }
        public string Message { get; set; } = string.Empty;

        public static LicenseStatus Parse(string backendResponse)
        {
            if (string.IsNullOrWhiteSpace(backendResponse))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    CanConvert = false,
                    Message = "No response from license server."
                };
            }

            // Normalize for comparison and handle potential JSON outer characters
            string status = backendResponse.Trim().ToLowerInvariant();

            // Check for keywords regardless of whether they are wrapped in JSON or plain text
            if (status.Contains("professional"))
            {
                return CreateProfessional();
            }

            if (status.Contains("expired"))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    CanConvert = false,
                    ExportFileLimit = 0,
                    Message = "Demo expired. Please purchase a plan."
                };
            }

            if (status.Contains("demo"))
            {
                return new LicenseStatus
                {
                    Tier = LicenseTier.Demo,
                    CanConvert = true,
                    ExportFileLimit = 50,
                    Message = "7-day free trial active (50 files per folder limit)."
                };
            }

            return new LicenseStatus
            {
                Tier = LicenseTier.DemoExpired,
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
}
