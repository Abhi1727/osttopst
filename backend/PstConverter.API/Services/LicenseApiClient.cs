// using System;
// using System.Threading.Tasks;
// using Microsoft.Extensions.Configuration;
// using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using PstConverter.Models;
// using System.Collections.Generic;
// using System.Linq;
using RestSharp;
using RestSharp.Authenticators;
// using Microsoft.Extensions.DependencyInjection;
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

            _baseUrl = configuration["LicenseApi:BaseUrl"] ?? throw new InvalidOperationException("LicenseApi:BaseUrl missing");
            _toolId = configuration["LicenseApi:ToolId"] ?? "1";
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
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("[LICENSE CACHE] Invalidated local cache for {LicenseId}", key);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Persistence Helpers
        // ─────────────────────────────────────────────────────────────────────


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
                        CanConvert = license.Tier != LicenseTier.DemoExpired && license.ExpiryDate > DateTime.Now,
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

                // The REST API is the source of truth for the tier. 
                // We update it whenever we have a fresh sync or purchase.
                license.Tier = s.Tier;

                if (updateAllotment || isNewRecord)
                {
                    // PURCHASE PATH or NEW RECORD: Write allotment.
                    if (s.TotalItemsAllotted > 0)
                        license.TotalItemsAllotted = s.TotalItemsAllotted;
                    if (s.TotalStorageAllotted > 0)
                        license.TotalStorageAllotted = s.TotalStorageAllotted;
                    if (s.TotalDaysAllotted > 0)
                        license.TotalDaysAllotted = s.TotalDaysAllotted;

                    license.ExpiryDate = s.ExpiryDate ?? DateTime.Now.AddDays(s.TotalDaysAllotted > 0 ? s.TotalDaysAllotted : 365);
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

                license.LastUpdated = DateTime.Now;
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
            var fullUrl = client.BuildUri(request).ToString();
            var body = request.Parameters.FirstOrDefault(p => p.Type == ParameterType.RequestBody)?.Value;
            var bodyJson = body != null ? JsonSerializer.Serialize(body, _jsonOptions) : "None";

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("[LICENSE API REQ] {Method} {Url} | Body: {Body}", request.Method, fullUrl, bodyJson);

            var response = await client.ExecuteAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                authService.InvalidateToken(licenseId, _toolId);
                client = await GetClientAsync(licenseId);
                response = await client.ExecuteAsync(request);
            }

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("[LICENSE API RES] {Url} | Status: {Status} | Content: {Content}", fullUrl, response.StatusCode, response.Content);

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
                var client = await GetClientAsync(licenseId);
                var request = new RestRequest("Licences/{licenseId}/Tools/{toolId}", Method.Get);
                request.AddParameter("licenseId", licenseId, ParameterType.UrlSegment);
                request.AddParameter("toolId", _toolId, ParameterType.UrlSegment);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (!response.IsSuccessful || string.IsNullOrWhiteSpace(response.Content))
                {
                    if (logger.IsEnabled(LogLevel.Warning))
                        logger.LogWarning("[LICENSE] GetLicenceStatus failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                    return LicenseTier.Demo;
                }

                var converter = new ConvertStringEnum();
                var tier = converter.ConvertStringToLicenseTier(response.Content);
                logger.LogInformation("[LICENSE STATUS] User: {User}, Tier: {Tier}", licenseId, tier);
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
                var client = await GetClientAsync(licenseId);
                var request = new RestRequest("Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}", Method.Get);
                request.AddParameter("licenseId", licenseId, ParameterType.UrlSegment);
                request.AddParameter("toolId", _toolId, ParameterType.UrlSegment);
                request.AddParameter("moduleId", _moduleId, ParameterType.UrlSegment);
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
        // public async Task<ItemStatus> GetItemStatus(string emailOrId, string? itemId = null)
        // {
        //     var licenseId = emailOrId.ToLowerInvariant();

        //     // If no itemId is provided, we shouldn't be checking item status. 
        //     // Default to Success to allow general flow to continue, but log it.
        //     if (string.IsNullOrEmpty(itemId))
        //     {
        //         logger.LogWarning("[LICENSE] GetItemStatus called without itemId for {User}", licenseId);
        //         return ItemStatus.Success;
        //     }

        //     try
        //     {
        //         var client = await GetClientAsync(licenseId);
        //         var request = new RestRequest("Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}", Method.Get);
        //         request.AddParameter("licenseId", licenseId, ParameterType.UrlSegment);
        //         request.AddParameter("toolId", _toolId, ParameterType.UrlSegment);
        //         request.AddParameter("moduleId", _moduleId, ParameterType.UrlSegment);
        //         request.AddParameter("itemId", itemId, ParameterType.UrlSegment);

        //         var response = await ExecuteWithRetryAsync(client, request, licenseId);

        //         if (logger.IsEnabled(LogLevel.Information))
        //             logger.LogInformation("[LICENSE API RES] {Url} | Status: {Status} | Content: {Content}",
        //                 client.BuildUri(request), response.StatusCode, response.Content);

        //         if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        //         {
        //             return ItemStatus.Success;
        //         }

        //         if (!response.IsSuccessful || string.IsNullOrWhiteSpace(response.Content))
        //         {
        //             return ItemStatus.Failed;
        //         }

        //         string content = response.Content!.Trim();

        //         if (content.StartsWith('{'))
        //         {
        //             try
        //             {
        //                 var detailed = JsonSerializer.Deserialize<DetailedLicenseStatus>(content, _jsonOptions);
        //                 if (detailed != null)
        //                 {
        //                     logger.LogInformation("[LICENSE] JSON received for item {ItemId}. Treating as Exist. Content: {Content}", itemId, content);
        //                     return ItemStatus.Exist;
        //                 }
        //             }
        //             catch (Exception ex)
        //             {
        //                 logger.LogWarning(ex, "[LICENSE] Failed to deserialize item JSON for {ItemId}", itemId);
        //             }
        //         }

        //         var converter = new ConvertStringEnum();
        //         return converter.ConvertStringToItemStatus(content);
        //     }
        //     catch (Exception ex)
        //     {
        //         logger.LogError(ex, "[LICENSE ITEM STATUS] GetItemStatus exception for {LicenseId}/{ItemId}", licenseId, itemId);
        //         return ItemStatus.Failed;
        //     }
        // }


        // ─────────────────────────────────────────────────────────────────────
        // 5. GET ...  →  DetailedLicenseStatus
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DetailedLicenseStatus> GetDetailedLicenseStatusAsync(string emailOrId, string? itemId)
        {
            var licenseId = emailOrId.ToLowerInvariant();

            // Cache key is user-only — itemId is not used to segment here
            // because we never call the Items endpoint from this method.
            var localCacheKey = $"{licenseId}_detail";
            if (_localCache.TryGetValue(localCacheKey, out var cached) && DateTime.Now < cached.Expires)
                return cached.Status;

            var cacheKey = $"license_status_{localCacheKey}";
            var cachedJson = await cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedJson))
            {
                try
                {
                    var s = JsonSerializer.Deserialize<DetailedLicenseStatus>(cachedJson);
                    if (s != null)
                    {
                        _localCache[localCacheKey] = (s, DateTime.Now.Add(_cacheDuration));
                        return s;
                    }
                }
                catch { }
            }

            // Only read usage counters from DB — CanConvert/tier/expiry come from the live API.
            (int itemsUsed, long storageUsed, LicenseTier dbTier) dbUsage = (0, 0, LicenseTier.Demo);
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var record = await db.MockLicenses.AsNoTracking().FirstOrDefaultAsync(l => l.LicenseId == licenseId);
                if (record != null)
                    dbUsage = (record.TotalItemsUsed, record.TotalStorageUsed, record.Tier);
            }
            catch (Exception ex) { logger.LogError(ex, "[LICENSE DB] Failed to load usage for {LicenseId}", licenseId); }

            try
            {
                var tier = await GetLicenceStatus(licenseId);

                // Always build from tier + quota only. Never call the Items endpoint here,
                // because doing so registers the item on the license server as a side effect.
                var quotaStatus = await FetchQuotaFromSubscriptionRequestAsync(licenseId, _toolId);

                DetailedLicenseStatus status;
                if (quotaStatus != null)
                {
                    quotaStatus.Tier = tier;
                    quotaStatus.CanConvert = tier != LicenseTier.DemoExpired;
                    quotaStatus.ExportFileLimit = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit;

                    // Carry over local usage counts only when the tier hasn't changed.
                    // This prevents stale usage from an old plan blocking a new plan's limits.
                    if (dbUsage.dbTier == tier)
                    {
                        quotaStatus.TotalItemsUsed = Math.Max(quotaStatus.TotalItemsUsed, dbUsage.itemsUsed);
                        quotaStatus.TotalStorageUsed = Math.Max(quotaStatus.TotalStorageUsed, dbUsage.storageUsed);
                    }

                    status = ApplyLimits(quotaStatus);
                    await UpdateLicenseInDbAsync(licenseId, status, updateAllotment: false);
                }
                else
                {
                    // Live API unavailable — fall back to BuildFallback with DB usage.
                    var fallback = BuildFallback(tier, null);
                    if (dbUsage.dbTier == tier)
                    {
                        fallback.TotalItemsUsed = dbUsage.itemsUsed;
                        fallback.TotalStorageUsed = dbUsage.storageUsed;
                        ApplyLimits(fallback);
                    }
                    status = fallback;
                }

                _localCache[localCacheKey] = (status, DateTime.Now.Add(_cacheDuration));

                logger.LogInformation("[LICENSE DETAILED] User: {User}, Tier: {Tier}, Items: {ItemsUsed}/{ItemsAllotted}, Storage: {StorageUsed}/{StorageAllotted}",
                    licenseId, status.Tier, status.TotalItemsUsed, status.TotalItemsAllotted, status.TotalStorageUsed, status.TotalStorageAllotted);

                await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(status), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });

                return status;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE] GetDetailedLicenseStatusAsync exception for {LicenseId}", licenseId);
                return BuildFallback(LicenseTier.DemoExpired, null);
            }
        }

    
      
      

        // ─────────────────────────────────────────────────────────────────────
        // PATCH .../AddStorage
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateItemStorageAsync(string emailOrId,string ToolId,string ModuleId, long ostFileSizeBytes, string itemName)
        {
            var licenseId = emailOrId.ToLowerInvariant();

            // Validate itemName is not empty before making API call
            if (string.IsNullOrWhiteSpace(itemName))
            {
                logger.LogWarning("[LICENSE STORAGE UPDATE] Skipped - itemName is empty for {LicenseId}", licenseId);
                return true;  // Return success to avoid blocking the conversion flow
            }

            try
            {
                var client = await GetClientAsync(licenseId);
                string ItemId = itemName;  // itemName already contains filename + size
                var request = new RestRequest("Licences/{licenseId}/Tools/{toolId}/Modules/{moduleId}/Items/{itemId}/AddItemStorage", Method.Patch);
                request.AddParameter("licenseId", licenseId, ParameterType.UrlSegment);
                request.AddParameter("toolId", ToolId, ParameterType.UrlSegment);
                request.AddParameter("moduleId", ModuleId, ParameterType.UrlSegment);
                request.AddParameter("itemId", ItemId, ParameterType.UrlSegment);

                request.AddJsonBody(new
                {
                    Size = ostFileSizeBytes,
                });

                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                if (response.IsSuccessful)
                {
                    if (logger.IsEnabled(LogLevel.Information))
                        logger.LogInformation("[LICENSE STORAGE UPDATE] [PATCH] Updated {Size} bytes for {LicenseId}", ostFileSizeBytes, licenseId);

                    InvalidateCache(licenseId);
                    return true;
                }

                logger.LogWarning("[LICENSE STORAGE UPDATE] [PATCH] Failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                return false;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE STORAGE UPDATE] [PATCH] Exception for {LicenseId}", licenseId);
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
                var client = await GetClientAsync(licenseId);
                var request = new RestRequest("Licences/{licenseId}/Tools/{toolId}/GenerateSubscriptionRequest", Method.Post);
                request.AddParameter("licenseId", licenseId, ParameterType.UrlSegment);
                request.AddParameter("toolId", toolId, ParameterType.UrlSegment);
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

                // After a successful POST, we don't manually assign "Professional" anymore.
                // We invalidate the cache and return success. The next GET / Licences/{userId}/Tools/{toolId}
                // or GetDetailedLicenseStatusAsync will reflect the new state from the server.

                logger.LogInformation("[LICENSE SUBSCRIPTION] Request sent for {LicenseId}. Cleared cache to trigger sync.", licenseId);

                return new SubscriptionResponse
                {
                    Success = true,
                    Message = "Subscription request processed. Status will update on next check.",
                    RawResponse = response.Content
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
                        TotalItemsAllotted = int.TryParse(quota.TotalItems, out var items) ? items : 4,
                        TotalStorageAllotted = long.TryParse(quota.Storage, out var storage) ? storage : 2073741824L,
                        TotalDaysAllotted = int.TryParse(quota.TotalDays, out var days) ? days : 365,
                    };
                }
            }
            catch { }
            return null;
        }

        public async Task<bool> WillExceedLimitAsync(string _licenseId, long _additionalBytes)
        {
            // Limits are disabled as per user request.
            return await Task.FromResult(false);
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

            if (s.ExpiryDate.HasValue && s.ExpiryDate < DateTime.Now)
                s.HitTimePeriodLimit = true;

            if (s.IsUsageRestricted)
                s.CanConvert = false;

            return s;
        }

        private static DetailedLicenseStatus BuildFallback(LicenseTier tier, DetailedLicenseStatus? existing = null) => ApplyLimits(new DetailedLicenseStatus
        {
            Tier = tier,
            CanConvert = tier != LicenseTier.DemoExpired,
            ExportFileLimit = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit,
            TotalItemsAllotted = tier == LicenseTier.Professional ? 100 : 50, // 50 items for Demo
            TotalItemsUsed = existing?.TotalItemsUsed ?? 0,
            TotalStorageAllotted = tier == LicenseTier.Professional ? 5368709120L : 524288000L, // 5GB vs 500MB
            TotalStorageUsed = existing?.TotalStorageUsed ?? 0,
            TotalDaysAllotted = tier == LicenseTier.Professional ? 365 : 7,
            ExpiryDate = tier == LicenseTier.Professional ? DateTime.Now.AddDays(365) : DateTime.Now.AddDays(7)
        });

    }
}