using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using PstConverter.Models;
using System.Collections.Generic;
using System.Linq;
using RestSharp;
using RestSharp.Authenticators;
using Microsoft.Extensions.DependencyInjection;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;

namespace PstConverter.Services
{
    /// <summary>
    /// Client for the external Aspose License REST API.
    /// </summary>
    public class LicenseApiClient
    {
        public LicenseApiClient(IConfiguration configuration, LicenseAuthService authService, 
                                ILogger<LicenseApiClient> logger, IDistributedCache cache,
                                IServiceScopeFactory scopeFactory)
        {
            this.logger = logger;
            this.authService = authService;
            this.cache = cache;
            this._scopeFactory = scopeFactory;

            _baseUrl  = configuration["LicenseApi:BaseUrl"]  ?? throw new InvalidOperationException("LicenseApi:BaseUrl missing");
            _toolId   = configuration["LicenseApi:ToolId"]   ?? "1";
            _moduleId = configuration["LicenseApi:ModuleId"] ?? "1";

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("[LICENSE INIT] BaseUrl: {BaseUrl}, ToolId: {ToolId}, ModuleId: {ModuleId}", _baseUrl, _toolId, _moduleId);
            }
        }

        private readonly ILogger<LicenseApiClient> logger;
        private readonly LicenseAuthService authService;
        private readonly IDistributedCache cache;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly string _baseUrl;
        private readonly string _toolId;
        private readonly string _moduleId;

        // In-memory cache to avoid hammering the license server on every request
        private readonly System.Collections.Concurrent.ConcurrentDictionary<string, (DetailedLicenseStatus Status, DateTime Expires)>
            _localCache = new();
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);
        private static readonly JsonSerializerOptions _jsonOptions = new() 
        { 
            PropertyNameCaseInsensitive = true,
            NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
        };

        public void InvalidateCache(string licenseId)
        {
            var key = licenseId.ToLowerInvariant();
            _localCache.TryRemove(key, out _);
            logger.LogInformation("[LICENSE CACHE] Invalidated local cache for {LicenseId}", key);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Persistence Helpers
        // ─────────────────────────────────────────────────────────────────────

        private async Task SaveUsageToDbAsync(string licenseId, int itemsUsed, long storageUsed)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var license = await db.MockLicenses.FirstOrDefaultAsync(l => l.LicenseId == licenseId);
                if (license != null)
                {
                    license.TotalItemsUsed = itemsUsed;
                    license.TotalStorageUsed = storageUsed;
                    license.LastUpdated = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE DB] Failed to save usage for {LicenseId}", licenseId);
            }
        }

        private async Task<DetailedLicenseStatus?> LoadStatusFromDbAsync(string licenseId)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var license = await db.MockLicenses.AsNoTracking().FirstOrDefaultAsync(l => l.LicenseId == licenseId);
                if (license != null)
                {
                    var status = new DetailedLicenseStatus
                    {
                        Tier = license.Tier,
                        TotalItemsAllotted = license.TotalItemsAllotted,
                        TotalItemsUsed = license.TotalItemsUsed,
                        TotalStorageAllotted = license.TotalStorageAllotted,
                        TotalStorageUsed = license.TotalStorageUsed,
                        TotalDaysAllotted = license.TotalDaysAllotted,
                        ExpiryDate = license.ExpiryDate,
                        CanConvert = license.Tier != LicenseTier.DemoExpired && license.ExpiryDate > DateTime.UtcNow,
                        ExportFileLimit = license.Tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit
                    };
                    return ApplyLimits(status);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE DB] Failed to load status for {LicenseId}", licenseId);
            }
            return null;
        }

        /// <param name="updateAllotment">If true, also updates allotment limits (items/storage/days).
        /// Set to true ONLY for subscription purchases. Server syncs MUST pass false to prevent
        /// overwriting purchased plan data with server's potentially stale values.</param>
        private async Task UpdateLicenseInDbAsync(string licenseId, DetailedLicenseStatus s, bool updateAllotment = false)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var license = await db.MockLicenses.FirstOrDefaultAsync(l => l.LicenseId == licenseId);
                var isNewRecord = license == null;
                if (license == null)
                {
                    license = new MockLicense { LicenseId = licenseId };
                    db.MockLicenses.Add(license);
                }

                // Prevent accidental downgrade from Professional to Demo during potentially flaky server syncs
                if (updateAllotment || isNewRecord || (int)s.Tier >= (int)license.Tier)
                {
                    license.Tier = s.Tier;
                }

                if (updateAllotment || isNewRecord)
                {
                    // PURCHASE PATH or NEW RECORD: Write allotment.
                    if (s.TotalItemsAllotted > 0)
                        license.TotalItemsAllotted = s.TotalItemsAllotted;
                    if (s.TotalStorageAllotted > 0)
                        license.TotalStorageAllotted = s.TotalStorageAllotted;
                    if (s.TotalDaysAllotted > 0)
                        license.TotalDaysAllotted = s.TotalDaysAllotted;
                    
                    license.ExpiryDate = s.ExpiryDate ?? DateTime.UtcNow.AddDays(s.TotalDaysAllotted > 0 ? s.TotalDaysAllotted : 365);
                    if (updateAllotment)
                    {
                        // Purchase: also reset usage
                        license.TotalItemsUsed = 0;
                        license.TotalStorageUsed = 0;
                    }
                    else
                    {
                        // New record: sync usage from server
                        license.TotalItemsUsed = Math.Max(license.TotalItemsUsed, s.TotalItemsUsed);
                        license.TotalStorageUsed = Math.Max(license.TotalStorageUsed, s.TotalStorageUsed);
                    }
                }
                else
                {
                    // EXISTING RECORD + SERVER SYNC: Update usage from server directly.
                    if (s.TotalItemsUsed > 0)
                        license.TotalItemsUsed = s.TotalItemsUsed;
                    if (s.TotalStorageUsed > 0)
                        license.TotalStorageUsed = s.TotalStorageUsed;
                }

                license.LastUpdated = DateTime.UtcNow;
                await db.SaveChangesAsync();

                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("[LICENSE DB] {Mode} OK for {LicenseId}. Plan={Tier}, {ItemsUsed}/{ItemsAllotted}",
                        updateAllotment ? "Purchase" : "Sync", licenseId, license.Tier, license.TotalItemsUsed, license.TotalItemsAllotted);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE DB] Failed to update status for {LicenseId}", licenseId);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────────────

        private async Task<RestClient> GetClientAsync(string licenseId)
        {
            var options = new RestClientOptions(_baseUrl)
            {
                RemoteCertificateValidationCallback = (_, _, _, _) => true,
                Timeout = TimeSpan.FromSeconds(10)
            };

            var token = await authService.GetTokenAsync(licenseId, _toolId);
            if (!string.IsNullOrEmpty(token))
                options.Authenticator = new JwtAuthenticator(token);

            return new RestClient(options);
        }

        private async Task<RestResponse> ExecuteWithRetryAsync(RestClient client, RestRequest request, string licenseId)
        {
            var response = await client.ExecuteAsync(request);
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                authService.InvalidateToken(licenseId, _toolId);
                client = await GetClientAsync(licenseId);
                response = await client.ExecuteAsync(request);
            }
            return response;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 1. GET Licences/{UserId}/Tools/{ToolId}
        // ─────────────────────────────────────────────────────────────────────
        public async Task<LicenseTier> GetLicenceStatus(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var client  = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}", Method.Get);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("[LICENSE DEBUG] GetLicenceStatus Raw: {Content}", response.Content);

                if (!response.IsSuccessful || string.IsNullOrWhiteSpace(response.Content))
                {
                    logger.LogWarning("[LICENSE] GetLicenceStatus failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                    return LicenseTier.Demo;
                }

                var converter = new ConvertStringEnum();
                var tier = converter.ConvertStringToLicenseTier(response.Content);
                return tier;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE] GetLicenceStatus exception for {LicenseId}", licenseId);
                return LicenseTier.Demo;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. GET Licences/{UserId}/Tools/{ToolId}/Modules/{ModuleId}
        // ─────────────────────────────────────────────────────────────────────
        public async Task<ModuleLicenseType> GetModuleVersion(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var client  = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}/Modules/{_moduleId}", Method.Get);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (!response.IsSuccessful || string.IsNullOrWhiteSpace(response.Content))
                {
                    logger.LogWarning("[LICENSE] GetModuleVersion failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                    return ModuleLicenseType.NotSubscribed;
                }

                var converter = new ConvertStringEnum();
                var moduleStatus = converter.ConvertStringToModuleLicenseType(response.Content);
                return moduleStatus;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE] GetModuleVersion exception for {LicenseId}", licenseId);
                return ModuleLicenseType.NotSubscribed;
            }
        }

        public static Task<ModuleLicenseType> GetModuleVersion()
            => Task.FromResult(ModuleLicenseType.Active);

        // ─────────────────────────────────────────────────────────────────────
        // 3. GET .../Items/{ItemId}  →  ItemStatus
        // ─────────────────────────────────────────────────────────────────────
        public async Task<ItemStatus> GetItemStatus(string emailOrId, string itemId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var client = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}/Modules/{_moduleId}/Items/{itemId}", Method.Get);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (logger.IsEnabled(LogLevel.Information))
                    logger.LogInformation("[LICENSE ITEM STATUS] GetItemStatus Raw: {Content}", response.Content);

                if (!response.IsSuccessful || string.IsNullOrWhiteSpace(response.Content))
                {
                    logger.LogWarning("[LICENSE ITEM STATUS] GetItemStatus failed for {LicenseId}/{ItemId}: {StatusCode}", licenseId, itemId, response.StatusCode);
                    return ItemStatus.Failed;
                }

                var converter = new ConvertStringEnum();
                return converter.ConvertStringToItemStatus(response.Content);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE ITEM STATUS] GetItemStatus exception for {LicenseId}/{ItemId}", licenseId, itemId);
                return ItemStatus.Failed;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. GET .../Items/{ItemId}  →  DetailedLicenseStatus
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DetailedLicenseStatus> GetDetailedLicenseStatusAsync(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();

            // 1. Fast local cache
            if (_localCache.TryGetValue(licenseId, out var cached) && DateTime.UtcNow < cached.Expires)
                return cached.Status;

            // 2. Redis / distributed cache
            var cacheKey   = $"license_status_{licenseId}";
            var cachedJson = await cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedJson))
            {
                try
                {
                    var s = JsonSerializer.Deserialize<DetailedLicenseStatus>(cachedJson);
                    if (s != null)
                    {
                        _localCache[licenseId] = (s, DateTime.UtcNow.Add(_cacheDuration));
                        return s;
                    }
                }
                catch { }
            }

            // 3. Prepare fallback/existing data in case API fails
            var dbStatus = await LoadStatusFromDbAsync(licenseId);
            _localCache.TryGetValue(licenseId, out var localCached);
            var existing = dbStatus ?? localCached.Status;

            try
            {
                var tier = await GetLicenceStatus(licenseId);
                var client   = await GetClientAsync(licenseId);
                var request  = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}/Modules/{_moduleId}/Items/{licenseId}", Method.Get);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                DetailedLicenseStatus status;

                if (response.IsSuccessful && !string.IsNullOrWhiteSpace(response.Content))
                {
                    string content = response.Content!.Trim();
                    try
                    {
                        DetailedLicenseStatus? apiStatus = null;

                        if (content.Equals("true", StringComparison.OrdinalIgnoreCase) || content.Equals("false", StringComparison.OrdinalIgnoreCase))
                        {
                            apiStatus = null;
                        }
                        else if (content.StartsWith('['))
                        {
                            var list = JsonSerializer.Deserialize<List<DetailedLicenseStatus>>(content, _jsonOptions);
                            apiStatus = list?.FirstOrDefault();
                        }
                        else if (content.StartsWith('{'))
                        {
                            apiStatus = JsonSerializer.Deserialize<DetailedLicenseStatus>(content, _jsonOptions);
                        }

                        // If API didn't provide quota, try FetchQuota endpoint
                        if (apiStatus == null || apiStatus.TotalItemsAllotted <= 0)
                        {
                            var quotaStatus = await FetchQuotaFromSubscriptionRequestAsync(licenseId, _toolId);
                            if (quotaStatus != null)
                            {
                                if (apiStatus == null) apiStatus = quotaStatus;
                                else
                                {
                                    apiStatus.TotalItemsAllotted = quotaStatus.TotalItemsAllotted;
                                    apiStatus.TotalStorageAllotted = quotaStatus.TotalStorageAllotted;
                                    apiStatus.TotalDaysAllotted = quotaStatus.TotalDaysAllotted;
                                }
                            }
                        }

                        if (apiStatus != null)
                        {
                            apiStatus.Tier = tier;
                            apiStatus.CanConvert = tier != LicenseTier.DemoExpired;
                            apiStatus.ExportFileLimit = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit;
                            
                            // MERGE logic: If API returns 0 usage but we have local usage, keep local.
                            if (existing != null)
                            {
                                apiStatus.TotalItemsUsed = Math.Max(apiStatus.TotalItemsUsed, existing.TotalItemsUsed);
                                apiStatus.TotalStorageUsed = Math.Max(apiStatus.TotalStorageUsed, existing.TotalStorageUsed);
                            }

                            status = ApplyLimits(apiStatus);
                            await UpdateLicenseInDbAsync(licenseId, status, updateAllotment: false);
                        }
                        else
                        {
                            status = dbStatus ?? BuildFallback(tier, localCached.Status);
                            ApplyLimits(status);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "[LICENSE] Deserialization failed for {LicenseId}. Using DB/Fallback.", licenseId);
                        status = dbStatus ?? BuildFallback(tier, localCached.Status);
                        ApplyLimits(status);
                    }
                }
                else
                {
                    logger.LogWarning("[LICENSE] API failed for {LicenseId}: {StatusCode}. Using DB/Fallback.", licenseId, response.StatusCode);
                    status = dbStatus ?? BuildFallback(tier, localCached.Status);
                    ApplyLimits(status);
                }

                _localCache[licenseId] = (status, DateTime.UtcNow.Add(_cacheDuration));
                await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(status), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });

                return status;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE] GetDetailedLicenseStatusAsync exception for {LicenseId}", licenseId);
                return dbStatus ?? BuildFallback(LicenseTier.DemoExpired, localCached.Status);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // PATCH .../AddStorage
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateStorageAsync(string emailOrId, long ostFileSizeBytes, string? itemName = null)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            // Use filename+size as the item identifier when available, so the license server
            // tracks each PST/OST file individually rather than lumping all under the email.
            var itemId = !string.IsNullOrWhiteSpace(itemName)
                ? Uri.EscapeDataString(itemName.Trim())
                : licenseId;

            try
            {
                var currentStatus = await GetDetailedLicenseStatusAsync(licenseId);
                
                // Gate only on storage/time — NOT item count.
                // Items are already gated in UpdateItemsAsync; once a file is started (items counted)
                // its storage update must always be allowed to complete, even when items == allotted.
                if (currentStatus.HitSizeLimit || currentStatus.HitTimePeriodLimit)
                {
                    logger.LogWarning("[LICENSE STORAGE] Storage/time limit hit for {LicenseId}. Storage: {StorageUsed}/{StorageAllotted}",
                        licenseId, currentStatus.TotalStorageUsed, currentStatus.TotalStorageAllotted);
                    return false;
                }

                var client  = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}/Modules/{_moduleId}/Items/{itemId}/AddStorage", Method.Patch);
                request.AddJsonBody(new { StorageInBytes = ostFileSizeBytes });

                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (!response.IsSuccessful)
                {
                    logger.LogWarning("[LICENSE STORAGE] AddStorage failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                    _localCache.TryRemove(licenseId, out _);
                    await cache.RemoveAsync($"license_status_{licenseId}");
                    return false;
                }

                if (_localCache.TryGetValue(licenseId, out var existing))
                {
                    existing.Status.TotalStorageUsed += ostFileSizeBytes;
                    ApplyLimits(existing.Status);
                    _localCache[licenseId] = (existing.Status, DateTime.UtcNow.Add(_cacheDuration));
                    await SaveUsageToDbAsync(licenseId, existing.Status.TotalItemsUsed, existing.Status.TotalStorageUsed);
                }
                else
                {
                    _localCache.TryRemove(licenseId, out _);
                }

                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE STORAGE] UpdateStorageAsync exception for {LicenseId}", licenseId);
                return false;
            }
        }

        public async Task<bool> UpdateItemsAsync(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var currentStatus = await GetDetailedLicenseStatusAsync(licenseId);

                // Gate on item count directly (>= means: at or past the cap → no new file).
                // Also gate on time expiry, but NOT on storage limit (storage is checked separately).
                if (currentStatus.HitTimePeriodLimit ||
                    (currentStatus.TotalItemsAllotted > 0 && currentStatus.TotalItemsUsed >= currentStatus.TotalItemsAllotted))
                {
                    logger.LogWarning("[LICENSE ITEMS] Item/time limit reached for {LicenseId}. Items: {Used}/{Allotted}",
                        licenseId, currentStatus.TotalItemsUsed, currentStatus.TotalItemsAllotted);
                    return false;
                }

                currentStatus.TotalItemsUsed += 1;
                ApplyLimits(currentStatus);
                _localCache[licenseId] = (currentStatus, DateTime.UtcNow.Add(_cacheDuration));
                await SaveUsageToDbAsync(licenseId, currentStatus.TotalItemsUsed, currentStatus.TotalStorageUsed);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE ITEMS] UpdateItemsAsync exception for {LicenseId}", licenseId);
                return false;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. GenerateSubscriptionRequestAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<SubscriptionResponse> GenerateSubscriptionRequestAsync(string emailOrId, string toolId, SubscriptionRequest subscriptionRequest)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            try
            {
                var client  = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{toolId}/GenerateSubscriptionRequest", Method.Post);
                request.AddJsonBody<object[]>(
                [
                    new
                    {
                        subscriptionRequest.TotalItems,
                        subscriptionRequest.Storage,
                        subscriptionRequest.TotalDays,
                        subscriptionRequest.ModuleId
                    }
                ]);

                var response = await ExecuteWithRetryAsync(client, request, licenseId);
                if (!response.IsSuccessful)
                {
                    return new SubscriptionResponse { Success = false, Message = response.Content };
                }

                _localCache.TryRemove(licenseId, out _);
                await cache.RemoveAsync($"license_status_{licenseId}");

                var quota = await FetchQuotaFromSubscriptionRequestAsync(licenseId, toolId);

                // Always build a guaranteed Professional status.
                // Use the external quota values if available; fall back to the submitted request params.
                var confirmedDays = (quota?.TotalDaysAllotted > 0 ? quota.TotalDaysAllotted : subscriptionRequest.TotalDays) > 0
                    ? (quota?.TotalDaysAllotted > 0 ? quota.TotalDaysAllotted : subscriptionRequest.TotalDays)
                    : 365;

                var newStatus = new DetailedLicenseStatus
                {
                    Tier                 = LicenseTier.Professional,
                    CanConvert           = true,
                    ExportFileLimit      = -1,
                    TotalItemsAllotted   = quota?.TotalItemsAllotted   > 0 ? quota.TotalItemsAllotted   : subscriptionRequest.TotalItems,
                    TotalStorageAllotted = quota?.TotalStorageAllotted > 0 ? quota.TotalStorageAllotted : subscriptionRequest.Storage,
                    TotalDaysAllotted    = confirmedDays,
                    TotalItemsUsed       = 0,
                    TotalStorageUsed     = 0,
                    ExpiryDate           = DateTime.UtcNow.AddDays(confirmedDays),
                };

                await UpdateLicenseInDbAsync(licenseId, newStatus, updateAllotment: true);
                _localCache[licenseId] = (newStatus, DateTime.UtcNow.Add(_cacheDuration));

                // Also warm the distributed cache so any second layer misses are avoided.
                var cacheKey = $"license_status_{licenseId}";
                await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(newStatus, _jsonOptions),
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });

                logger.LogInformation("[LICENSE SUBSCRIPTION] Purchase complete for {LicenseId}. Tier=Professional, Items={Items}, Storage={Storage}GB, Days={Days}",
                    licenseId, newStatus.TotalItemsAllotted, newStatus.TotalStorageAllotted / 1073741824.0, confirmedDays);

                return new SubscriptionResponse
                {
                    Success     = true,
                    Message     = "Subscription updated successfully",
                    AllottedData = newStatus
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE SUBSCRIPTION] GenerateSubscriptionRequestAsync exception for {LicenseId}", licenseId);
                return new SubscriptionResponse { Success = false, Message = ex.Message };
            }
        }

        private async Task<DetailedLicenseStatus?> FetchQuotaFromSubscriptionRequestAsync(string licenseId, string toolId)
        {
            try
            {
                var client = await GetClientAsync(licenseId);
                var request = new RestRequest($"Licences/{licenseId}/Tools/{toolId}/GenerateSubscriptionRequest", Method.Get);
                var response = await client.ExecuteAsync(request);
                
                if (response.IsSuccessful && !string.IsNullOrWhiteSpace(response.Content))
                {
                    var content = response.Content.Trim();
                    List<LicenseServerQuota>? quotaList = null;

                    if (content.StartsWith('['))
                        quotaList = JsonSerializer.Deserialize<List<LicenseServerQuota>>(content, _jsonOptions);
                    else
                    {
                        var single = JsonSerializer.Deserialize<LicenseServerQuota>(content, _jsonOptions);
                        if (single != null) quotaList = [single];
                    }

                    if (quotaList == null || quotaList.Count == 0) return null;
                    var quota = quotaList.FirstOrDefault(x => x.ModuleId == _moduleId) ?? quotaList.First();

                    return new DetailedLicenseStatus
                    {
                        TotalItemsAllotted   = int.TryParse(quota.TotalItems, out var items) ? items : 4,
                        TotalStorageAllotted = long.TryParse(quota.Storage, out var storage) ? storage : 2073741824L,
                        TotalDaysAllotted    = int.TryParse(quota.TotalDays, out var days) ? days : 365,
                    };
                }
            }
            catch { }
            return null;
        }

        public async Task<bool> WillExceedLimitAsync(string licenseId, long additionalBytes)
        {
            var status = await GetDetailedLicenseStatusAsync(licenseId);
            if (status.TotalStorageAllotted == -1) return false;
            return (status.TotalStorageUsed + additionalBytes) > status.TotalStorageAllotted;
        }

        private static DetailedLicenseStatus ApplyLimits(DetailedLicenseStatus s)
        {
            s.HitFileCountLimit = false;
            s.HitSizeLimit = false;
            s.HitTimePeriodLimit = false;

            if (s.TotalItemsAllotted > 0 && s.TotalItemsUsed >= s.TotalItemsAllotted) 
                s.HitFileCountLimit = true;
            
            if (s.TotalStorageAllotted > 0 && s.TotalStorageUsed >= s.TotalStorageAllotted) 
                s.HitSizeLimit = true;
            
            if (s.ExpiryDate.HasValue && s.ExpiryDate < DateTime.UtcNow) 
                s.HitTimePeriodLimit = true;

            return s;
        }

        private static DetailedLicenseStatus BuildFallback(LicenseTier tier, DetailedLicenseStatus? existing = null) => ApplyLimits(new DetailedLicenseStatus
        {
            Tier                  = tier,
            CanConvert            = tier != LicenseTier.DemoExpired,
            ExportFileLimit       = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit,
            TotalItemsAllotted    = tier == LicenseTier.Professional ? 100 : 4,
            TotalItemsUsed        = existing?.TotalItemsUsed ?? 0,
            TotalStorageAllotted  = tier == LicenseTier.Professional ? 53687091200L : 2073741824L, // 50GB vs 2GB
            TotalStorageUsed      = existing?.TotalStorageUsed ?? 0,
            TotalDaysAllotted     = tier == LicenseTier.Professional ? 365 : 7,
            ExpiryDate            = tier == LicenseTier.Professional ? DateTime.UtcNow.AddDays(365) : DateTime.UtcNow.AddDays(7)
        });

        public static Task<bool> Addfileforlicense() => Task.FromResult(true);
    }
}