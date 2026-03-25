using System.Security.Claims;

namespace PstConverter.Extensions;

public static class IdentityExtensions
{
    public static string GetUserEmailId(this ClaimsPrincipal user, string? emailOverride = null, string? configDefault = null)
    {
        if (!string.IsNullOrEmpty(emailOverride)) return emailOverride.ToLowerInvariant();

        var email = user.FindFirstValue(ClaimTypes.Email) 
                 ?? user.FindFirstValue("emails")
                 ?? user.FindFirstValue("email")
                 ?? user.FindFirstValue("emailaddress")
                 ?? user.FindFirstValue("email_address")
                 ?? user.FindFirstValue("primary_email_address")
                 ?? user.FindFirstValue("preferred_username")
                 ?? user.FindFirstValue("name")
                 // Last resort: scan all claims for anything that looks like an email
                 ?? user.Claims.FirstOrDefault(c => c.Value.Contains("@") && c.Value.Contains("."))?.Value;

        if (!string.IsNullOrEmpty(email)) return email.ToLowerInvariant();

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? configDefault ?? "unauthenticated";
        
        // Final fallback: Log what's happening so we can see why it failed.
        if (userId.StartsWith("user_"))
        {
            Console.WriteLine($"[IDENTITY FALLBACK] Resolving for User: {userId} | Authenticated: {user.Identity?.IsAuthenticated} | AuthType: {user.Identity?.AuthenticationType}");
            Console.WriteLine("[IDENTITY CLAIMS DEBUG] Printing ALL claims to find email source:");
            foreach (var claim in user.Claims)
            {
                Console.WriteLine($"  - Type: {claim.Type} | Value: {claim.Value}");
            }
        }

        return userId.ToLowerInvariant();
    }
    
    public static string GetInternalUserId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unauthenticated";
    }
}
