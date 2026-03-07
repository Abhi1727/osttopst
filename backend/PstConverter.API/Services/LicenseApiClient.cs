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
        private readonly string _baseUrl;
        private readonly LicenseAuthService _authService;

        public LicenseApiClient(IConfiguration configuration, LicenseAuthService authService)
        {
            _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:BaseUrl is missing in appsettings.json!");
            _authService = authService;
            Console.WriteLine($"[LICENSE CONFIG] BaseUrl: {_baseUrl}");
        }

        private async Task<RestClient> GetClientAsync(string licenseId, string toolId)
        {
            var options = new RestClientOptions(_baseUrl)
            {
                RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true
            };

            var token = await _authService.GetTokenAsync(licenseId, toolId);
            if (!string.IsNullOrEmpty(token))
            {
                options.Authenticator = new JwtAuthenticator(token);
            }

            return new RestClient(options);
        }

        public async Task<string> GetLicenceStatus(string licenseId, string toolId)
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}";
            var request = new RestRequest(path);

            Console.WriteLine($"[LICENSE API] Requesting status for License ID (Email): {licenseId}, Tool: {toolId} from {_baseUrl}{path}");
            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                throw new Exception($"License server returned error: {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
            }

            return response.Content ?? string.Empty;
        }

        public async Task<string> TrackUsageAsync(string licenseId, string toolId = "1", string moduleId = "1")
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}";
            var request = new RestRequest(path);

            Console.WriteLine($"[LICENSE TRACK] License ID (Email): {licenseId}, Path: {path}");
            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                Console.WriteLine($"[LICENSE TRACK ERROR] {response.StatusCode} - {response.ErrorMessage}");
            }

            return response.Content ?? string.Empty;
        }

        public async Task<string> ModuleActivated(string licenseId, string toolId, string moduleId)
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}";
            var request = new RestRequest(path, Method.Get);

            Console.WriteLine($"[LICENSE API] Checking Module activation: {path}");
            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                Console.WriteLine($"[MODULE ACTIVATED ERROR] {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
            }

            return response.Content ?? string.Empty;
        }

        public async Task<string> UpdateStorageAsync(string licenseId, string toolId, string moduleId, string itemId, long ostFileSizeBytes)
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddStorage";
            var request = new RestRequest(path, Method.Patch);
            request.AddJsonBody(new { AddStorage = ostFileSizeBytes });

            Console.WriteLine($"[LICENSE API] UpdateStorage: {path}, Size: {ostFileSizeBytes} bytes");
            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                Console.WriteLine($"[UPDATE STORAGE ERROR] {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
            }

            return response.Content ?? string.Empty;
        }

        public async Task<LicenseStatus> GetDetailedLicenseStatusAsync(string licenseId, string toolId = "1")
        {
            try
            {
                var rawStatus = await GetLicenceStatus(licenseId, toolId);
                Console.WriteLine($"[LICENSE DEBUG] Raw response: '{rawStatus}'");

                if (string.IsNullOrEmpty(rawStatus))
                {
                    throw new Exception("Empty response from license server.");
                }

                var status = LicenseStatus.Parse(rawStatus);
                Console.WriteLine($"[LICENSE MAPPED] License ID (Email): {licenseId}, Tier: {status.Tier}, CanConvert: {status.CanConvert}");
                return status;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LICENSE FAIL] License ID (Email): {licenseId}, Error: {ex.Message}");
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
