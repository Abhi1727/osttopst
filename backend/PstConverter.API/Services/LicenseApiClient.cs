using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PstConverter.Models;
using RestSharp;
using RestSharp.Authenticators;

namespace PstConverter.Services
{
    /// <summary>
    /// Service client for interacting with the external license API.
    /// </summary>
    public class LicenseApiClient
    {
        private readonly string _baseUrl;
        private readonly LicenseAuthService _authService;

    
        public LicenseApiClient(IConfiguration configuration, LicenseAuthService authService)
        {
            _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:BaseUrl is missing in appsettings.json!");
            _authService = authService;
            // Console.WriteLine($"[LICENSE CONFIG] BaseUrl: {_baseUrl}");
        }

        /// <summary>
        /// Creates and configures a RestClient with necessary authentication tokens.
        /// </summary>
        /// <param name="licenseId">The user's license ID (email).</param>
        /// <param name="toolId">The ID of the tool being accessed.</param>
        /// <returns>A configured RestClient instance.</returns>
        private async Task<RestClient> GetClientAsync(string licenseId, string toolId)
        {
            var options = new RestClientOptions(_baseUrl)
            {
                RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true,
                Timeout = TimeSpan.FromSeconds(3) // 3 seconds timeout
            };

            var token = await _authService.GetTokenAsync(licenseId, toolId);
            if (!string.IsNullOrEmpty(token))
            {
                options.Authenticator = new JwtAuthenticator(token);
            }

            return new RestClient(options);
        }

        /// <summary>
        /// Fetches the license tier for a specific user and tool.
        /// </summary>
        /// <param name="licenseId">The user's license ID (email).</param>
        /// <param name="toolId">The ID of the tool.</param>
        /// <returns>The user's license tier (Professional, Demo, etc.).</returns>
        public async Task<LicenseTier> GetLicenceStatus(string licenseId, string toolId = "1")
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}";
            var request = new RestRequest(path);

            // Console.WriteLine($"[LICENSE API] Requesting status for License ID (Email): {licenseId}, Tool: {toolId} from {_baseUrl}{path}");
            var response = await client.ExecuteAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                // Console.WriteLine($"[LICENSE API] Map request Unauthorized. Invalidating token and retrying...");
                _authService.InvalidateToken(licenseId, toolId);
                client = await GetClientAsync(licenseId, toolId);
                response = await client.ExecuteAsync(request);
            }

            if (!response.IsSuccessful || string.IsNullOrEmpty(response.Content))
            {
                // Console.WriteLine($"[LICENSE API] Map request failed. Status Code: {response.StatusCode}, Error: {response.ErrorMessage}");
                return LicenseTier.Demo; // Fallback to Demo so app remains usable when server is down
                //throw new Exception($"License server returned error: {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
            }
            // Console.WriteLine($"[LICENSE MAPPED] License ID (Email): {licenseId}, Tier: {response.Content}");

            return new ConvertStringEnum().ConvertStringToLicenseTier(response.Content ?? string.Empty);
        }

        /// <summary>
        /// Fetches the module-specific license version or status.
        /// </summary>
        /// <param name="licenseId">The user's license ID (email).</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="moduleId">The module ID within the tool.</param>
        /// <returns>The module license type (Active, Expired, etc.).</returns>
        public async Task<ModuleLicenseType> GetModuleVersion(string licenseId, string toolId = "1", string moduleId = "1")
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}";
            var request = new RestRequest(path);

            // Console.WriteLine($"[LICENSE TRACK] License ID (Email): {licenseId}, Path: {path}");
            var response = await client.ExecuteAsync(request);

            if (!response.IsSuccessful)
            {
                // Console.WriteLine($"[LICENSE TRACK ERROR] {response.StatusCode} - {response.ErrorMessage}");
            }

            return new ConvertStringEnum().ConvertStringToModuleLicenseType(response.Content ?? string.Empty);
        }

        /// <summary>
        /// Checks if a specific module is activated for the user.
        /// </summary>
        /// <param name="licenseId">The user's license ID.</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="moduleId">The module ID.</param>
        /// <returns>A string response from the license server.</returns>
        // public async Task<string> ModuleActivated(string licenseId, string toolId, string moduleId)
        // {
        //     var client = await GetClientAsync(licenseId, toolId);
        //     var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}";
        //     var request = new RestRequest(path, Method.Get);

        //     // Console.WriteLine($"[LICENSE API] Checking Module activation: {path}");
        //     var response = await client.ExecuteAsync(request);

        //     if (!response.IsSuccessful)
        //     {
        //         // Console.WriteLine($"[MODULE ACTIVATED ERROR] {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
        //     }

        //     return response.Content ?? string.Empty;
        // }

        /// <summary>
        /// Registers a file for the user's license to track converted items.
        /// </summary>
        /// <param name="licenseId">The user's license ID.</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="itemId">The item or file ID.</param>
        /// <returns>True if registration was successful; otherwise, false.</returns>
        public async Task<bool> Addfileforlicense(string licenseId, string toolId, string moduleId, string itemId)
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}";
            var request = new RestRequest(path, Method.Get);
            var response = await client.ExecuteAsync(request);

            if (response.StatusCode != System.Net.HttpStatusCode.OK || response.Content == "false")
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Updates the consumed storage for a user's license on the license server.
        /// </summary>
        /// <param name="licenseId">The user's license ID.</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="ostFileSizeBytes">The size of the file processsed in bytes.</param>
        /// <returns>True if the storage update was successful; otherwise, false.</returns>
        public async Task<bool> UpdateStorageAsync(string licenseId, string toolId, string moduleId, long ostFileSizeBytes)
        {
            //var licenseStatus = await GetDetailedLicenseStatusAsync(licenseId, toolId);
            long reportedSize = ostFileSizeBytes;

            // if (licenseStatus.Tier == LicenseTier.Professional && licenseStatus.RemainingStorage < ostFileSizeBytes)
            // {
            //     reportedSize = licenseStatus.RemainingStorage;
            //     // Console.WriteLine($"[LICENSE API] Capping storage update for {licenseId}: {ostFileSizeBytes} -> {reportedSize} (Insufficient Storage)");
            // }

            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/AddStorage";
            var request = new RestRequest(path, Method.Patch);
            request.AddJsonBody(new { Size = reportedSize });

            // Console.WriteLine($"[LICENSE API] UpdateStorage: {path}, Size: {reportedSize} bytes");
            var response = await client.ExecuteAsync(request);

            if (response.StatusCode != System.Net.HttpStatusCode.OK || response.Content == "false")
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Forwards a pricing-plan purchase request to the external license API.
        /// Called when the user clicks "Buy Now" on the pricing/plan page.
        /// </summary>
        /// <param name="licenseId">The user's license ID (email).</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="request">The subscription plan details (items, storage, days, planId, moduleId).</param>
        /// <returns>A <see cref="SubscriptionResponse"/> indicating success or failure.</returns>
        public async Task<SubscriptionResponse> GenerateSubscriptionRequestAsync(string licenseId, string toolId, SubscriptionRequest request)
        {
            var client = await GetClientAsync(licenseId, toolId);
            var path = $"Licences/{licenseId}/Tools/{toolId}/GenerateSubscriptionRequest";
            var restRequest = new RestRequest(path, Method.Post);
            restRequest.AddJsonBody(request);

            var response = await client.ExecuteAsync(restRequest);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                _authService.InvalidateToken(licenseId, toolId);
                client = await GetClientAsync(licenseId, toolId);
                response = await client.ExecuteAsync(restRequest);
            }

            if (!response.IsSuccessful)
            {
                return new SubscriptionResponse
                {
                    Success = false,
                    Message = $"License server returned: {(int)response.StatusCode} - {response.ErrorMessage ?? response.Content}",
                    RawResponse = response.Content
                };
            }

            return new SubscriptionResponse
            {
                Success = true,
                Message = "Subscription request accepted.",
                RawResponse = response.Content
            };
        }

        // public async Task<string> UpdateStorageAsync(string licenseId, string toolId, string moduleId, string itemId, long ostFileSizeBytes)
        // {
        //     var client = await GetClientAsync(licenseId, toolId);
        //     var path = $"Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddStorage";
        //     var request = new RestRequest(path, Method.Patch);
        //     request.AddJsonBody(new { AddStorage = ostFileSizeBytes });

        //     Console.WriteLine($"[LICENSE API] UpdateStorage: {path}, Size: {ostFileSizeBytes} bytes");
        //     var response = await client.ExecuteAsync(request);

        //     if (!response.IsSuccessful)
        //     {
        //         Console.WriteLine($"[UPDATE STORAGE ERROR] {response.StatusCode} - {response.ErrorMessage ?? response.Content}");
        //     }

        //     return response.Content ?? string.Empty;
        // }

        // public async Task<LicenseStatus> GetDetailedLicenseStatusAsync(string licenseId, string toolId = "1")
        // {
        //     try
        //     {
        //         var status = await GetLicenceStatus(licenseId, toolId);

        //         return ;
        //     }
        //     catch (Exception ex)
        //     {
        //         Console.WriteLine($"[LICENSE FAIL] License ID (Email): {licenseId}, Error: {ex.Message}");
        //         return new LicenseStatus
        //         {
        //             Tier = LicenseTier.DemoExpired,
        //             Status = ModuleLicenseType.NotSubscribed,
        //             CanConvert = false,
        //             ExportFileLimit = 0,
        //             Message = $"License Check Failed: {ex.Message}"
        //         };
        //     }
        // }
    }
}