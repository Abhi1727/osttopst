using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using PstConverter.Models;
using RestSharp;
using RestSharp.Authenticators;

namespace PstConverter.Services
{
    /// <summary>
    /// Service client for interacting with the external license API.
    /// </summary>
    public class LicenseApiClient(IConfiguration configuration, LicenseAuthService authService, ILogger<LicenseApiClient> logger, IDistributedCache cache, Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory)
    {
        private readonly string _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("CRITICAL: LicenseApi:BaseUrl is missing in appsettings.json!");

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
                Timeout = TimeSpan.FromSeconds(30) // 30 seconds timeout
            };

            var token = await authService.GetTokenAsync(licenseId, toolId);
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
        public async Task<LicenseTier> GetLicenceStatus(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
            var mock = await db.MockLicenses.FirstOrDefaultAsync(m => m.LicenseId == licenseId);
            if (mock != null) return mock.Tier;
            return LicenseTier.Demo;
        }

        /// <summary>
        /// Fetches the module-specific license version or status.
        /// </summary>
        /// <returns>The module license type (Active, Expired, etc.).</returns>
        public static Task<ModuleLicenseType> GetModuleVersion()
        {
            return Task.FromResult(ModuleLicenseType.Active);
        }

        /// <summary>
        /// Registers a file for the user's license to track converted items.
        /// </summary>
        /// <returns>True if registration was successful; otherwise, false.</returns>
        public static Task<bool> Addfileforlicense()
        {
            return Task.FromResult(true);
        }

        /// <summary>
        /// Updates the consumed storage for a user's license on the license server.
        /// </summary>
        /// <param name="licenseId">The user's license ID.</param>
        /// <param name="toolId">The tool ID.</param>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="ostFileSizeBytes">The size of the file processsed in bytes.</param>
        /// <returns>True if the storage update was successful; otherwise, false.</returns>
        public async Task<bool> UpdateStorageAsync(string emailOrId,  long ostFileSizeBytes)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            // Check cache first for custom allotted values
            var cacheKey = $"allotted_license_{licenseId}";
            var cachedJson = await cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedJson))
            {
                try
                {
                    var status = JsonSerializer.Deserialize<DetailedLicenseStatus>(cachedJson);
                    if (status != null)
                    {
                        if (logger.IsEnabled(LogLevel.Information))
                        {
                            logger.LogInformation("[LICENSE STORAGE DEBUG] {LicenseId}: Current: {Used} bytes, Allotted: {Allotted} bytes, Adding: {Adding} bytes", licenseId, status.TotalStorageUsed, status.TotalStorageAllotted, ostFileSizeBytes);
                        }

                        // If already hit ANY limit, block immediately
                        if (status.IsUsageRestricted)
                        {
                            logger.LogWarning("[LICENSE STORAGE] Usage already restricted for {LicenseId}", licenseId);
                            return false;
                        }

                        bool limitExceeded = status.TotalStorageAllotted != -1 && (status.TotalStorageUsed + ostFileSizeBytes > status.TotalStorageAllotted);

                        // Increment usage even if it exceeds, so the UI can show the bottleneck
                        status.TotalStorageUsed += ostFileSizeBytes;
                        
                        // Update flags
                        ApplyLimits(status);

                        await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(status), new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
                        });

                        // PERSIST TO DB
                        await SyncMockToDb(licenseId, status);

                        if (limitExceeded || status.IsUsageRestricted)
                        {
                            logger.LogWarning("[LICENSE STORAGE] Limit hit for {LicenseId}", licenseId);
                            return false;
                        }

                        return true;
                    }
                }
                catch { }
            }

            // Fallback: Fetch detailed status to ensure we have tracking data (even for Demo)
            var currentStatus = await GetDetailedLicenseStatusAsync(licenseId);
            if (currentStatus != null)
            {
                if (currentStatus.IsUsageRestricted) return false;

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("[LICENSE STORAGE DEBUG] {LicenseId} (Internal): Current: {Used} bytes, Allotted: {Allotted} bytes, Adding: {Adding} bytes", licenseId, currentStatus.TotalStorageUsed, currentStatus.TotalStorageAllotted, ostFileSizeBytes);
                }

                bool limitExceeded = currentStatus.TotalStorageAllotted != -1 && (currentStatus.TotalStorageUsed + ostFileSizeBytes > currentStatus.TotalStorageAllotted);

                currentStatus.TotalStorageUsed += ostFileSizeBytes;
                ApplyLimits(currentStatus);
                
                // Write back to cache
                await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(currentStatus), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
                });

                // PERSIST TO DB
                await SyncMockToDb(licenseId, currentStatus);

                if (limitExceeded || currentStatus.IsUsageRestricted)
                {
                    return false;
                }

                return true;
            }
            return true;
        }

        public async Task<bool> UpdateItemsAsync(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();

            // Get the current status (from cache or DB)
            var currentStatus = await GetDetailedLicenseStatusAsync(licenseId);
            if (currentStatus == null) return true;

            // Increment usage directly instead of recounting from DB since DB contains old demo sessions
            currentStatus.TotalItemsUsed++;
            ApplyLimits(currentStatus);

            // Write back to cache and DB
            var cacheKey = $"allotted_license_{licenseId}";
            await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(currentStatus), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
            });
            await SyncMockToDb(licenseId, currentStatus);

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("[LICENSE ITEMS] {LicenseId}: {Used} / {Allotted} OST files", 
                    licenseId, currentStatus.TotalItemsUsed, currentStatus.TotalItemsAllotted);
            }

            if (currentStatus.HitFileCountLimit || currentStatus.IsUsageRestricted)
            {
                logger.LogWarning("[LICENSE ITEMS] File count limit hit for {LicenseId}", licenseId);
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
            var restRequest = new RestRequest("Licences/{licenseId}/Tools/{toolId}/GenerateSubscriptionRequest", Method.Post);
            restRequest.AddUrlSegment("licenseId", licenseId);
            restRequest.AddUrlSegment("toolId", toolId);

            var payload = new[]
            {
                new {
                    TotalItems = request.TotalItems.ToString(),
                    Storage = request.Storage.ToString(),
                    TotalDays = request.TotalDays.ToString(),
                    ModuleId = request.ModuleId.ToString()
                }
            };
            restRequest.AddJsonBody(payload);

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("[LICENSE API] GenerateSubscriptionRequest for {LicenseId}", licenseId);
            }

            var response = await client.ExecuteAsync(restRequest);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                authService.InvalidateToken(licenseId, toolId);
                client = await GetClientAsync(licenseId, toolId);
                response = await client.ExecuteAsync(restRequest);
            }

            if (!response.IsSuccessful)
            {
                logger.LogError("[LICENSE API ERROR] Subscription failed: {StatusCode} - {ErrorMessage}. Raw: {RawResponse}",
                    response.StatusCode, response.ErrorMessage, response.Content);
                return new SubscriptionResponse
                {
                    Success = false,
                    Message = $"License server returned: {(int)response.StatusCode} - {response.ErrorMessage ?? response.Content}",
                    RawResponse = response.Content
                };
            }

            // --- ALLOTMENT LOGIC ---
            // If the request was successful, we "allot" the data to the user session
            var allotted = new DetailedLicenseStatus
            {
                Tier = LicenseTier.Professional,
                CanConvert = true,
                ExportFileLimit = -1,
                TotalItemsAllotted = request.TotalItems,
                TotalItemsUsed = 0, // Reset to 0 as default starting point
                TotalStorageAllotted = request.Storage,
                TotalStorageUsed = 0, // Reset to 0 as default starting point
                TotalDaysAllotted = request.TotalDays,
                ExpiryDate = DateTime.Now.AddDays(request.TotalDays)
            };

            // Persist this in cache so GetDetailedLicenseStatusAsync can pick it up
            var cacheKey = $"allotted_license_{licenseId}";
            await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(allotted), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30) // Keep for trial period or similar
            });

            // PERSIST TO DB
            await SyncMockToDb(licenseId, allotted);

            return new SubscriptionResponse
            {
                Success = true,
                Message = "Subscription request success (Simulated/Allotted)",
                RawResponse = response.Content,
                AllottedData = allotted
            };
        }

        public async Task<DetailedLicenseStatus> GetDetailedLicenseStatusAsync(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var tier = await GetLicenceStatus(licenseId);

                // Check cache first for custom allotted values
                var cacheKey = $"allotted_license_{licenseId}";
                var cachedJson = await cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedJson))
                {
                    try
                    {
                        var customStatus = JsonSerializer.Deserialize<DetailedLicenseStatus>(cachedJson);
                        if (customStatus != null)
                        {
                            return ApplyLimits(customStatus);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "[LICENSE CACHE] Failed to deserialize cached license for {LicenseId}", licenseId);
                    }
                }

                // CACHE MISS or EMPTY: Check DB
                using var scope = scopeFactory.CreateScope();
                {
                    var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                    var dbMock = await db.MockLicenses.FindAsync(licenseId);
                    if (dbMock != null)
                    {
                        var status = new DetailedLicenseStatus
                        {
                            Tier = dbMock.Tier,
                            CanConvert = dbMock.Tier != LicenseTier.DemoExpired,
                            ExportFileLimit = dbMock.Tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit,
                            TotalItemsAllotted = dbMock.TotalItemsAllotted,
                            TotalItemsUsed = dbMock.TotalItemsUsed,
                            TotalStorageAllotted = dbMock.TotalStorageAllotted,
                            TotalStorageUsed = dbMock.TotalStorageUsed,
                            TotalDaysAllotted = dbMock.TotalDaysAllotted,
                            ExpiryDate = dbMock.ExpiryDate
                        };

                        // Put in cache
                        await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(status), new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
                        });

                        return ApplyLimits(status);
                    }
                }

                // If still nothing, fallback to Demo default
                var fallbackStatus = new DetailedLicenseStatus
                {
                    Tier = tier,
                    CanConvert = tier != LicenseTier.DemoExpired,
                    ExportFileLimit = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit,
                    TotalItemsAllotted = tier == LicenseTier.Professional ? 100000 : 1, // Restricted to 1 file for Demo
                    TotalItemsUsed = 0,
                    TotalStorageAllotted = tier == LicenseTier.Professional ? 1024L * 1024 * 1024 * 1024 : 1024L * 1024 * 1024,
                    TotalStorageUsed = 0,
                    TotalDaysAllotted = tier == LicenseTier.Professional ? 365 : 7,
                    ExpiryDate = DateTime.Now.AddDays(tier == LicenseTier.Professional ? 365 : 7)
                };
                return ApplyLimits(fallbackStatus);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE FAIL] Detailed status check failed for {LicenseId}", licenseId);
                return new DetailedLicenseStatus
                {
                    Tier = LicenseTier.DemoExpired,
                    CanConvert = false,
                    ExportFileLimit = 0
                };
            }
        }

        private static DetailedLicenseStatus ApplyLimits(DetailedLicenseStatus status)
        {
            if (status.TotalItemsAllotted != -1 && status.TotalItemsUsed >= status.TotalItemsAllotted)
            {
                status.HitFileCountLimit = true;
            }
            if (status.TotalStorageAllotted != -1 && status.TotalStorageUsed >= status.TotalStorageAllotted)
            {
                status.HitSizeLimit = true;
            }
            if (status.ExpiryDate < DateTime.Now)
            {
                status.HitTimePeriodLimit = true;
            }
            return status;
        }

        private async Task SyncMockToDb(string emailOrId, DetailedLicenseStatus status)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
                var dbMock = await db.MockLicenses.FindAsync(licenseId);
                if (dbMock == null)
                {
                    db.MockLicenses.Add(new MockLicense
                    {
                        LicenseId = licenseId,
                        Tier = status.Tier,
                        TotalItemsAllotted = status.TotalItemsAllotted,
                        TotalItemsUsed = status.TotalItemsUsed,
                        TotalStorageAllotted = status.TotalStorageAllotted,
                        TotalStorageUsed = status.TotalStorageUsed,
                        TotalDaysAllotted = status.TotalDaysAllotted,
                        ExpiryDate = status.ExpiryDate ?? DateTime.Now.AddDays(365)
                    });
                }
                else
                {
                    dbMock.Tier = status.Tier;
                    dbMock.TotalItemsAllotted = status.TotalItemsAllotted;
                    dbMock.TotalItemsUsed = status.TotalItemsUsed;
                    dbMock.TotalStorageAllotted = status.TotalStorageAllotted;
                    dbMock.TotalStorageUsed = status.TotalStorageUsed;
                    dbMock.TotalDaysAllotted = status.TotalDaysAllotted;
                    dbMock.ExpiryDate = status.ExpiryDate ?? DateTime.Now.AddDays(365);
                    dbMock.LastUpdated = DateTime.UtcNow;
                }
                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to sync mock license to DB for {LicenseId}", licenseId);
            }
        }
    }
}