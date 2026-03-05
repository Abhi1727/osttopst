using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PstConverter.Models;
using RestSharp;
using RestSharp.Authenticators;

namespace PstConverter.Services
{
    public class LicenseApiClient
    {
        private readonly LicenseAuthService _authService;
        private readonly string _baseUrl;
        private readonly string _defaultToolId;
        private readonly string _defaultUserId;

        public LicenseApiClient(LicenseAuthService authService, IConfiguration configuration)
        {
            _authService = authService;
            
            // Strictly require configuration - no fallbacks
            _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:BaseUrl is missing in appsettings.json!");
            _defaultToolId = configuration["LicenseApi:ToolId"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:ToolId is missing in appsettings.json!");
            _defaultUserId = configuration["LicenseApi:UserId"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:UserId is missing in appsettings.json!");
            
            Console.WriteLine($"[LICENSE CONFIG] BaseUrl: {_baseUrl}, DefaultUser: {_defaultUserId}, ToolId: {_defaultToolId}");
        }



        private async Task<RestClient> GetClientAsync(string userId, string toolId, bool forceAuth = false)
        {
            var options = new RestClientOptions(_baseUrl)
            {
                RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true
            };

            try
            {
                var token = await _authService.GetTokenAsync(userId, toolId);
                if (!string.IsNullOrEmpty(token))
                {
                    options.Authenticator = new JwtAuthenticator(token);
                }
                else if (forceAuth)
                {
                    throw new Exception("Authentication token is required but could not be obtained.");
                }
            }
            catch (Exception ex)
            {
                // Bubbling up error instead of silent "warning" to ensure visibility
                Console.WriteLine($"[AUTH ERROR] Authentication failed for {userId}: {ex.Message}");
                if (forceAuth) throw;
            }

            return new RestClient(options);
        }

        public async Task<string> GetLicenceStatus(string userId, string toolId)
        {
            var client = await GetClientAsync(userId, toolId, forceAuth: false);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}");
            Console.WriteLine($"[API DEBUG] GET {_baseUrl}Licences/{userId}/Tools/{toolId}");
            var response = await client.ExecuteAsync(request);
            
            if (!response.IsSuccessful)
            {
                 throw new Exception($"License server returned error: {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
            }
            
            return response.Content ?? string.Empty;
        }

        public async Task<string> ModuleActivated(string userId, string toolId, string moduleId)
        {
            var client = await GetClientAsync(userId, toolId, forceAuth: false);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}");
            Console.WriteLine($"[API DEBUG] GET {_baseUrl}Licences/{userId}/Tools/{toolId}/Modules/{moduleId}");
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }

        public async Task<string> GetItemStatus(string userId, string toolId, string moduleId, string itemId)
        {
            var client = await GetClientAsync(userId, toolId, forceAuth: false);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}");
            Console.WriteLine($"[API DEBUG] GET {_baseUrl}Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}");
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }

        public async Task<string> UpdateStorage(string userId, string toolId, string moduleId, string itemId, object storageData)
        {
            var client = await GetClientAsync(userId, toolId, forceAuth: true); // Updating storage likely requires auth
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddStorage", Method.Patch);
            Console.WriteLine($"[API DEBUG] PATCH {_baseUrl}Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddStorage");
            request.AddJsonBody(storageData);
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }

        public async Task<LicenseStatus> GetDetailedLicenseStatusAsync(string userId, string? toolId = null)
        {
            var activeToolId = string.IsNullOrEmpty(toolId) ? _defaultToolId : toolId;

            // Strict UserID resolution: Use provided ID if available, otherwise use configured default.
            var activeUserId = (!string.IsNullOrEmpty(userId) && userId != "anonymous") ? userId : _defaultUserId;

            try
            {
                var rawStatus = await GetLicenceStatus(activeUserId, activeToolId);
                Console.WriteLine($"[LICENSE DEBUG] Raw response for {activeUserId}: '{rawStatus}'");

                if (string.IsNullOrEmpty(rawStatus))
                {
                    throw new Exception("Empty response from license server.");
                }

                var status = LicenseStatus.Parse(rawStatus);
                Console.WriteLine($"[LICENSE MAPPED] User: {activeUserId}, Tier: {status.Tier}, CanConvert: {status.CanConvert}");
                return status;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LICENSE FAIL] User: {activeUserId}, Error: {ex.Message}");
                // REMOVED: Automatic "Demo" fallback. If it fails, strictly report failure.
                return new LicenseStatus 
                { 
                    Tier = LicenseTier.DemoExpired, 
                    CanConvert = false, 
                    ExportFileLimit = 0, 
                    Message = $"License Check Failed: {ex.Message}" 
                };
            }
        }



    }
}
