using System;

namespace PstConverter.Models
{
    public class LicenseRequestParameters
    {
        public string? UserId { get; set; }
        public string? ToolId { get; set; }
        public string? ModuleId { get; set; }
        // public string? ItemId { get; set; } we will pass this as An argument in the function
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
