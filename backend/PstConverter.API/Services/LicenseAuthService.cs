using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RestSharp;
using PstConverter.Models;

namespace PstConverter.Services
{
    /// <summary>
    /// Service responsible for authenticating with the external license API and managing JWT tokens.
    /// </summary>
    public class LicenseAuthService(IConfiguration configuration, ILogger<LicenseAuthService> logger)
    {
        private readonly string _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("LicenseApi:BaseUrl missing");
        private readonly string _username = configuration["LicenseApi:Username"] ?? "admin";
        private readonly string _password = configuration["LicenseApi:Password"] ?? "1234";
        private readonly ILogger<LicenseAuthService> _logger = logger;
        private readonly ConcurrentDictionary<string, LicenseToken> _tokenCache = new();

        /// <summary>
        /// Retrieves a valid JWT token from the cache or by authenticating with the license server.
        /// </summary>
        /// <param name="licenseId">The license ID (typically user email).</param>
        /// <param name="toolId">The ID of the tool for which authentication is requested.</param>
        /// <returns>A valid JWT token string, or null if authentication fails.</returns>
        public async Task<string?> GetTokenAsync(string licenseId, string toolId)
        {
            var cacheKey = $"{licenseId}_{toolId}";
            if (_tokenCache.TryGetValue(cacheKey, out var cachedToken) && !cachedToken.IsExpired)
            {
                return cachedToken.Token;
            }

            try
            {
                var options = new RestClientOptions(_baseUrl)
                {
                    RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true,
                    Timeout = TimeSpan.FromSeconds(30) // 30 seconds timeout
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

                _logger.LogInformation("[LICENSE AUTH] Attempting login for License ID (Email): {LicenseId} at {BaseUrl}Auth/login", licenseId, _baseUrl);
                var response = await client.ExecuteAsync<TokenResponse>(request);

                if (response.IsSuccessful && response.Data != null)
                {
                    var newToken = new LicenseToken(response.Data.Token);
                    _tokenCache[cacheKey] = newToken;
                    return newToken.Token;
                }

                _logger.LogError("[LICENSE AUTH ERROR] {StatusCode} - {ErrorMessage}. Content: {ResponseContent}", response.StatusCode, response.ErrorMessage, response.Content);
                _tokenCache.TryRemove(cacheKey, out _);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "[LICENSE AUTH CRITICAL] {Message}", ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Removes a cached token from the internal cache, forcing a re-authentication on the next request.
        /// </summary>
        /// <param name="licenseId">The license ID.</param>
        /// <param name="toolId">The tool ID.</param>
        public void InvalidateToken(string licenseId, string toolId)
        {
            var cacheKey = $"{licenseId}_{toolId}";
            _tokenCache.TryRemove(cacheKey, out _);
            _logger.LogInformation("[LICENSE AUTH] Token invalidated for {LicenseId}", licenseId);
        }

        private class TokenResponse
        {
            public string Token { get; set; } = string.Empty;
        }
    }
}
