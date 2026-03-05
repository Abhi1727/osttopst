using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PstConverter.Models;
using RestSharp;

namespace PstConverter.Services
{
    public class LicenseAuthService
    {
        private readonly RestClient _restClient;
        private readonly IConfiguration _configuration;
        private LicenseToken? _currentToken;
        private readonly string _baseUrl;

        public LicenseAuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _baseUrl = _configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:BaseUrl is missing in appsettings.json!");
            var options = new RestClientOptions(_baseUrl)
            {
                RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true
            };
            _restClient = new RestClient(options);
        }

        public async Task<string> GetTokenAsync(string userId, string toolId)
        {
            if (_currentToken == null || _currentToken.IsExpired)
            {
                await RefreshTokenAsync(userId, toolId);
            }

            return _currentToken?.Token ?? string.Empty;
        }

        private async Task RefreshTokenAsync(string userId, string toolId)
        {
            var request = new RestRequest("Auth/login", Method.Post);
            request.AddJsonBody(new LoginRequest
            {
                UserId = userId,
                ToolId = toolId
            });

            var response = await _restClient.ExecuteAsync<LoginResponse>(request);

            if (response.IsSuccessful && response.Data != null)
            {
                if (!string.IsNullOrEmpty(response.Data.Token))
                {
                    _currentToken = new LicenseToken(response.Data.Token);
                }
            }
            else
            {
                throw new Exception($"Failed to authenticate with license server: {response.ErrorMessage ?? response.Content}");
            }
        }
    }
}
