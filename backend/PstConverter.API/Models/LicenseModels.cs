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

    public class LicenseToken
    {
        public string Token { get; private set; }
        public DateTime CreatedAt { get; private set; }

        public LicenseToken(string token)
        {
            Token = token;
            CreatedAt = DateTime.UtcNow;
        }

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
