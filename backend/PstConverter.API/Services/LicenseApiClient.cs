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

        public LicenseApiClient(LicenseAuthService authService, IConfiguration configuration)
        {
            _authService = authService;
            _baseUrl = configuration["LicenseApi:BaseUrl"] ?? "https://api.license-server.com/";
        }

        private async Task<RestClient> GetClientAsync(string userId, string toolId)
        {
            var token = await _authService.GetTokenAsync(userId, toolId);
            var options = new RestClientOptions(_baseUrl)
            {
                Authenticator = new JwtAuthenticator(token)
            };
            return new RestClient(options);
        }

        public async Task<string> GetLicenceStatus(string userId, string toolId)
        {
            var client = await GetClientAsync(userId, toolId);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}");
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }

        public async Task<string> ModuleActivated(string userId, string toolId, string moduleId)
        {
            var client = await GetClientAsync(userId, toolId);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}");
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
  
        }

        public async Task<string> GetItemStatus(string userId, string toolId, string moduleId, string itemId)
        {
            var client = await GetClientAsync(userId, toolId);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}");
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }

        public async Task<string> UpdateStorage(string userId, string toolId, string moduleId, string itemId, object storageData)
        {
            var client = await GetClientAsync(userId, toolId);
            var request = new RestRequest($"Licences/{userId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddStorage", Method.Patch);
            request.AddJsonBody(storageData);
            var response = await client.ExecuteAsync(request);
            return response.Content ?? string.Empty;
        }
    }
}

