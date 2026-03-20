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

                license.Tier = s.Tier;

                if (updateAllotment || isNewRecord)
                {
                    // PURCHASE PATH or NEW RECORD: Write allotment.
                    // For new records, we always write whatever the server says so the record
                    // is valid from the start. For purchases, we write the exact purchased values.
                    if (s.TotalItemsAllotted > 0)
                        license.TotalItemsAllotted = s.TotalItemsAllotted;
                    if (s.TotalStorageAllotted > 0)
                        license.TotalStorageAllotted = s.TotalStorageAllotted;
                    if (s.TotalDaysAllotted > 0)
                        license.TotalDaysAllotted = s.TotalDaysAllotted;
                    // Ensure a valid expiry date is always set
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
                    // Trust the server's reported count — it's authoritative.
                    // Only fall back to local count if server reports 0 (server might not track yet).
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
        // 3. GET .../Items/{ItemId}  →  DetailedLicenseStatus
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DetailedLicenseStatus> GetDetailedLicenseStatusAsync(string emailOrId)
        {
            var licenseId = emailOrId.ToLowerInvariant();

            // Fast local cache
            if (_localCache.TryGetValue(licenseId, out var cached) && DateTime.UtcNow < cached.Expires)
                return cached.Status;

            // Redis / distributed cache
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

            try
            {
                var tier = await GetLicenceStatus(licenseId);
                var itemId = licenseId;

                var client   = await GetClientAsync(licenseId);
                var request  = new RestRequest($"Licences/{licenseId}/Tools/{_toolId}/Modules/{_moduleId}/Items/{itemId}", Method.Get);
                var response = await ExecuteWithRetryAsync(client, request, licenseId);

                DetailedLicenseStatus status;

                if (response.IsSuccessful && !string.IsNullOrWhiteSpace(response.Content))
                {
                    string content = response.Content!.Trim();
                    try
                    {
                        DetailedLicenseStatus? apiStatus = null;

                        if (content.Equals("true", StringComparison.OrdinalIgnoreCase)) apiStatus = null;
                        else if (content.Equals("false", StringComparison.OrdinalIgnoreCase)) apiStatus = null;
                        else if (content.StartsWith("["))
                        {
                            var list = JsonSerializer.Deserialize<List<DetailedLicenseStatus>>(content, _jsonOptions);
                            apiStatus = list?.FirstOrDefault();
                        }
                        else if (content.StartsWith("{"))
                        {
                            apiStatus = JsonSerializer.Deserialize<DetailedLicenseStatus>(content, _jsonOptions);
                        }
                        else
                        {
                            // It's likely a plain string like "Professional", "Active", "Demo" etc.
                            // These don't contain detailed usage data, so we treat it as no detailed status returned.
                            if (logger.IsEnabled(LogLevel.Information))
                                logger.LogInformation("[LICENSE] GetItemStatus returned plain string instead of object for {LicenseId}: {Content}", licenseId, content);
                            apiStatus = null;
                        }

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
                            
                            status = ApplyLimits(apiStatus);
                            
                            if (logger.IsEnabled(LogLevel.Information))
                                logger.LogInformation("[LICENSE] GetItemStatus OK for {LicenseId}. Items: {Used}/{Allotted}", 
                                    licenseId, status.TotalItemsUsed, status.TotalItemsAllotted);
                            
                            // SYNC: Update only usage, NEVER allotment (server may have wrong values)
                            await UpdateLicenseInDbAsync(licenseId, status, updateAllotment: false);
                        }
                        else
                        {
                            var dbStatus = await LoadStatusFromDbAsync(licenseId);
                            if (dbStatus != null)
                            {
                                status = dbStatus;
                                if (_localCache.TryGetValue(licenseId, out var existing))
                                {
                                    status.TotalItemsUsed = Math.Max(status.TotalItemsUsed, existing.Status.TotalItemsUsed);
                                    status.TotalStorageUsed = Math.Max(status.TotalStorageUsed, existing.Status.TotalStorageUsed);
                                }
                            }
                            else
                            {
                                status = BuildFallback(tier);
                                if (_localCache.TryGetValue(licenseId, out var existing))
                                {
                                    status.TotalItemsUsed = existing.Status.TotalItemsUsed;
                                    status.TotalStorageUsed = existing.Status.TotalStorageUsed;
                                }
                            }
                            ApplyLimits(status);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "[LICENSE] Failed to deserialize GetItemStatus response for {LicenseId}. Content: {RawContent}", licenseId, content);
                        var dbStatus = await LoadStatusFromDbAsync(licenseId);
                        status = dbStatus ?? BuildFallback(tier);
                        if (_localCache.TryGetValue(licenseId, out var existing))
                        {
                            status.TotalItemsUsed = Math.Max(status.TotalItemsUsed, existing.Status.TotalItemsUsed);
                            status.TotalStorageUsed = Math.Max(status.TotalStorageUsed, existing.Status.TotalStorageUsed);
                        }
                        ApplyLimits(status);
                    }
                }
                else
                {
                    logger.LogWarning("[LICENSE] GetItemStatus failed for {LicenseId}: {StatusCode}", licenseId, response.StatusCode);
                    var dbStatus = await LoadStatusFromDbAsync(licenseId);
                    status = dbStatus ?? BuildFallback(tier);
                    if (_localCache.TryGetValue(licenseId, out var existing))
                    {
                        status.TotalItemsUsed = Math.Max(status.TotalItemsUsed, existing.Status.TotalItemsUsed);
                        status.TotalStorageUsed = Math.Max(status.TotalStorageUsed, existing.Status.TotalStorageUsed);
                    }
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
                return new DetailedLicenseStatus { Tier = LicenseTier.DemoExpired, CanConvert = false, ExportFileLimit = 0 };
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. PATCH .../AddStorage
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateStorageAsync(string emailOrId, long ostFileSizeBytes)
        {
            var licenseId = emailOrId.ToLowerInvariant();
            var itemId    = licenseId;

            try
            {
                if (_localCache.TryGetValue(licenseId, out var cached) && DateTime.UtcNow < cached.Expires)
                {
                    if (cached.Status.IsUsageRestricted)
                    {
                        // Cache says restricted. Evict and re-check from DB in case it's stale.
                        _localCache.TryRemove(licenseId, out _);
                        var freshStatus = await LoadStatusFromDbAsync(licenseId);
                        if (freshStatus != null && freshStatus.IsUsageRestricted)
                        {
                            logger.LogWarning("[LICENSE STORAGE] Already restricted for {LicenseId}. Items: {Used}/{Allotted}, Storage: {StorageUsed}/{StorageAllotted}",
                                licenseId, freshStatus.TotalItemsUsed, freshStatus.TotalItemsAllotted, freshStatus.TotalStorageUsed, freshStatus.TotalStorageAllotted);
                            return false;
                        }
                        // DB says OK — cache was stale. Allow through.
                        if (freshStatus != null)
                            _localCache[licenseId] = (freshStatus, DateTime.UtcNow.Add(_cacheDuration));
                    }
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
                // Get current status to check restriction — read from DB for accuracy
                // Do NOT call UpdateStorageAsync(0) here: that hits the server's AddStorage endpoint
                // with 0 bytes which causes the server to count it as an item use (double-counting).
                var currentStatus = _localCache.TryGetValue(licenseId, out var cached)
                    ? cached.Status
                    : await LoadStatusFromDbAsync(licenseId);

                if (currentStatus == null)
                    currentStatus = BuildFallback(LicenseTier.Professional);

                if (currentStatus.IsUsageRestricted)
                {
                    logger.LogWarning("[LICENSE ITEMS] Already restricted for {LicenseId}. Items: {Used}/{Allotted}",
                        licenseId, currentStatus.TotalItemsUsed, currentStatus.TotalItemsAllotted);
                    return false;
                }

                // Increment item count locally
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
                request.AddJsonBody(new[]
                {
                    new
                    {
                        TotalItems = subscriptionRequest.TotalItems.ToString(),
                        Storage    = subscriptionRequest.Storage.ToString(),
                        TotalDays  = subscriptionRequest.TotalDays.ToString(),
                        ModuleId   = subscriptionRequest.ModuleId.ToString()
                    }
                });

                var response = await ExecuteWithRetryAsync(client, request, licenseId);
                if (!response.IsSuccessful)
                {
                    return new SubscriptionResponse { Success = false, Message = response.Content };
                }

                _localCache.TryRemove(licenseId, out _);
                await cache.RemoveAsync($"license_status_{licenseId}");

                // Save the exact plan values the user requested directly to DB.
                // Do NOT re-fetch from the server here because it may return stale/cached data.
                var activatedStatus = new DetailedLicenseStatus
                {
                    Tier                 = LicenseTier.Professional,
                    CanConvert           = true,
                    ExportFileLimit      = -1,
                    TotalItemsAllotted   = subscriptionRequest.TotalItems,
                    TotalItemsUsed       = 0,
                    TotalStorageAllotted = subscriptionRequest.Storage,
                    TotalStorageUsed     = 0,
                    TotalDaysAllotted    = subscriptionRequest.TotalDays,
                    ExpiryDate           = DateTime.UtcNow.AddDays(subscriptionRequest.TotalDays)
                };
                // PURCHASE: Save exact purchased values. updateAllotment=true is crucial here.
                await UpdateLicenseInDbAsync(licenseId, activatedStatus, updateAllotment: true);
                _localCache[licenseId] = (activatedStatus, DateTime.UtcNow.Add(_cacheDuration));

                return new SubscriptionResponse
                {
                    Success      = true,
                    Message      = "Subscription activated successfully",
                    RawResponse  = response.Content,
                    AllottedData = activatedStatus
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[LICENSE] GenerateSubscriptionRequestAsync exception for {LicenseId}", licenseId);
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

                    if (content.StartsWith("["))
                        quotaList = JsonSerializer.Deserialize<List<LicenseServerQuota>>(content, _jsonOptions);
                    else
                    {
                        var single = JsonSerializer.Deserialize<LicenseServerQuota>(content, _jsonOptions);
                        if (single != null) quotaList = new List<LicenseServerQuota> { single };
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

        private static DetailedLicenseStatus BuildFallback(LicenseTier tier) => ApplyLimits(new DetailedLicenseStatus
        {
            Tier                  = tier,
            CanConvert            = tier != LicenseTier.DemoExpired,
            ExportFileLimit       = tier == LicenseTier.Professional ? -1 : AllConstants.DemoExportLimit,
            TotalItemsAllotted    = tier == LicenseTier.Professional ? 100 : 4,
            TotalItemsUsed        = 0,
            TotalStorageAllotted  = tier == LicenseTier.Professional ? 53687091200L : 2073741824L, // 50GB vs 2GB
            TotalStorageUsed      = 0,
            TotalDaysAllotted     = tier == LicenseTier.Professional ? 365 : 7,
            ExpiryDate            = tier == LicenseTier.Professional ? DateTime.UtcNow.AddDays(365) : DateTime.UtcNow.AddDays(7)
        });

        public static Task<bool> Addfileforlicense() => Task.FromResult(true);
    }
}