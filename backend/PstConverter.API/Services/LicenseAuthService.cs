using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using RestSharp;

namespace PstConverter.Services
{
    public class LicenseAuthService(IConfiguration configuration)
    {
        private readonly string _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("LicenseApi:BaseUrl missing");
        private readonly string _username = configuration["LicenseApi:Username"] ?? "admin";
        private readonly string _password = configuration["LicenseApi:Password"] ?? "1234";
        private readonly ConcurrentDictionary<string, string> _tokenCache = new();

        public async Task<string?> GetTokenAsync(string licenseId, string toolId)
        {
            var cacheKey = $"{licenseId}_{toolId}";
            if (_tokenCache.TryGetValue(cacheKey, out var token))
            {
                return token;
            }

            try
            {
                var options = new RestClientOptions(_baseUrl)
                {
                    RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true
                };
                var client = new RestClient(options);
                var request = new RestRequest("Auth/login", Method.Post);

                // Use configured credentials
                request.AddJsonBody(new
                {
                    Username = _username,
                    Password = _password,
                    userId = licenseId, // The license server expects 'userId' as the field name
                    toolId
                });

                Console.WriteLine($"[LICENSE AUTH] Attempting login for License ID (Email): {licenseId} at {_baseUrl}Auth/login");
                var response = await client.ExecuteAsync<TokenResponse>(request);

                if (response.IsSuccessful && response.Data != null)
                {
                    var newToken = response.Data.Token;
                    _tokenCache.TryAdd(cacheKey, newToken);
                    return newToken;
                }

                Console.WriteLine($"[LICENSE AUTH ERROR] {response.StatusCode} - {response.ErrorMessage}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LICENSE AUTH CRITICAL] {ex.Message}");
                return null;
            }
        }

        private class TokenResponse
        {
            public string Token { get; set; } = string.Empty;
        }
    }
}
