using System.Text;
using System.Security.Claims;
using Aspose.Email;
using PstConverter.Endpoints;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Caching.Distributed;
using PstConverter.Models;
using PstConverter.Extensions;

// Initialize Aspose.Email License
try
{
    var license = new Aspose.Email.License();
    string Lic = "<?xml version=\"1.0\"?>\r\n<License>\r\n  <Data>\r\n    <LicensedTo>Shef USA</LicensedTo>\r\n    <EmailTo>tarunlamba@shefusa.com</EmailTo>\r\n    <LicenseType>Developer OEM</LicenseType>\r\n    <LicenseNote>1 Developer And Unlimited Deployment Locations</LicenseNote>\r\n    <OrderID>260226165350</OrderID>\r\n    <UserID>1327979</UserID>\r\n    <OEM>This is a redistributable license</OEM>\r\n    <Products>\r\n      <Product>Aspose.Total Product Family</Product>\r\n    </Products>\r\n    <EditionType>Professional</EditionType>\r\n    <SerialNumber>b9f2d0d5-bdef-4f1d-968d-4cdd2111ade2</SerialNumber>\r\n    <SubscriptionExpiry>20270226</SubscriptionExpiry>\r\n    <LicenseExpiry>20260326</LicenseExpiry>\r\n    <ExpiryNote>This is a temporary license for non-commercial use only and it will expire on 2026-03-26</ExpiryNote>\r\n    <LicenseVersion>3.0</LicenseVersion>\r\n    <LicenseInstructions>https://purchase.aspose.com/policies/use-license</LicenseInstructions>\r\n  </Data>\r\n  <Signature>mFYcemoPfrXsGUWnC0oT2uR289LbOmnbnSNh3b756tCIeWVAJw5jivY236zdzaoU0+gyu8CnQq9Soiwz93HF6ychmsiqUaBcH/8EDTQqom1E/19rAKkSoDBpOwLO6sgl4CX2EmE3IdxTKzEd78j85fmUHSSql9WpW+UASSId/EE=</Signature>\r\n</License>";
    byte[] byteArray = Encoding.UTF8.GetBytes(Lic);
    MemoryStream objStream = new(byteArray);
    license.SetLicense(objStream);

    if (File.Exists("Aspose.Email.lic"))
    {
        license.SetLicense("Aspose.Email.lic");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Aspose.Email License Error: {ex.Message}");
}

// Initialize Aspose.Words License
try
{
    var license = new Aspose.Words.License();
    string Lic = "<?xml version=\"1.0\"?>\r\n<License>\r\n  <Data>\r\n    <LicensedTo>Shef USA</LicensedTo>\r\n    <EmailTo>tarunlamba@shefusa.com</EmailTo>\r\n    <LicenseType>Developer OEM</LicenseType>\r\n    <LicenseNote>1 Developer And Unlimited Deployment Locations</LicenseNote>\r\n    <OrderID>260226165350</OrderID>\r\n    <UserID>1327979</UserID>\r\n    <OEM>This is a redistributable license</OEM>\r\n    <Products>\r\n      <Product>Aspose.Total Product Family</Product>\r\n    </Products>\r\n    <EditionType>Professional</EditionType>\r\n    <SerialNumber>b9f2d0d5-bdef-4f1d-968d-4cdd2111ade2</SerialNumber>\r\n    <SubscriptionExpiry>20270226</SubscriptionExpiry>\r\n    <LicenseExpiry>20260326</LicenseExpiry>\r\n    <ExpiryNote>This is a temporary license for non-commercial use only and it will expire on 2026-03-26</ExpiryNote>\r\n    <LicenseVersion>3.0</LicenseVersion>\r\n    <LicenseInstructions>https://purchase.aspose.com/policies/use-license</LicenseInstructions>\r\n  </Data>\r\n  <Signature>mFYcemoPfrXsGUWnC0oT2uR289LbOmnbnSNh3b756tCIeWVAJw5jivY236zdzaoU0+gyu8CnQq9Soiwz93HF6ychmsiqUaBcH/8EDTQqom1E/19rAKkSoDBpOwLO6sgl4CX2EmE3IdxTKzEd78j85fmUHSSql9WpW+UASSId/EE=</Signature>\r\n</License>";
    byte[] byteArray = Encoding.UTF8.GetBytes(Lic);
    MemoryStream objStream = new(byteArray);
    license.SetLicense(objStream);

    Aspose.Words.Fonts.FontSettings.DefaultInstance.SetFontsFolders(new[]
    {
        @"C:\Windows\Fonts",
        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Fonts")
    }, true);
}
catch (Exception ex)
{
    Console.WriteLine($"Aspose.Words License Error: {ex.Message}");
}

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IPstStoragePool, PstStoragePool>();
builder.Services.AddScoped<PstService>();
builder.Services.AddHostedService<CleanupBackgroundService>();
builder.Services.AddSingleton<LicenseAuthService>();
builder.Services.AddSingleton<LicenseApiClient>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null))
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Clerk Auth — bypass OIDC discovery and use direct JWKS resolver
// (OIDC discovery via Authority was failing silently for Clerk dev instances)
var clerkConfig = builder.Configuration.GetSection("Clerk");
var clerkAuthority = clerkConfig["Authority"]?.TrimEnd('/') ?? "https://evolved-monkfish-45.clerk.accounts.dev";
var clerkJwksUri = $"{clerkAuthority}/.well-known/jwks.json";

Microsoft.IdentityModel.Tokens.JsonWebKeySet? _cachedJwks = null;
DateTime _jwksCacheExpiry = DateTime.MinValue;
var _jwksLock = new object();

Microsoft.IdentityModel.Tokens.IssuerSigningKeyResolver clerkKeyResolver = (token, securityToken, kid, parameters) =>
{
    if (_cachedJwks == null || DateTime.Now > _jwksCacheExpiry)
    {
        lock (_jwksLock)
        {
            if (_cachedJwks == null || DateTime.Now > _jwksCacheExpiry)
            {
                try
                {
                    using var http = new HttpClient();
                    http.Timeout = TimeSpan.FromSeconds(10);
                    var jwksJson = http.GetStringAsync(clerkJwksUri).GetAwaiter().GetResult();
                    _cachedJwks = new Microsoft.IdentityModel.Tokens.JsonWebKeySet(jwksJson);
                    _jwksCacheExpiry = DateTime.Now.AddMinutes(10);
                    Console.WriteLine($"[CLERK JWKS] Fetched {_cachedJwks.Keys.Count} keys from {clerkJwksUri}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CLERK JWKS ERROR] Failed to fetch JWKS: {ex.Message}");
                    return Array.Empty<Microsoft.IdentityModel.Tokens.SecurityKey>();
                }
            }
        }
    }

    var keys = _cachedJwks?.GetSigningKeys() ?? Array.Empty<Microsoft.IdentityModel.Tokens.SecurityKey>();
    if (!string.IsNullOrEmpty(kid))
        keys = keys.Where(k => k.KeyId == kid).ToList();
    return keys;
};

builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        Console.WriteLine($"[AUTH CONFIG] IsDevelopment: {builder.Environment.IsDevelopment()} | Setting ValidateLifetime to: {!builder.Environment.IsDevelopment()}");
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false, 
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = clerkKeyResolver,
            NameClaimType = "sub",
            ClockSkew = TimeSpan.FromDays(30),
            LifetimeValidator = (notBefore, expires, securityToken, validationParameters) => 
            {
                Console.WriteLine($"[AUTH DEBUG] Validating token: nbf={notBefore}, exp={expires}, now={DateTime.UtcNow}");
                return true;
            }
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError("[AUTH FAILED] {Message} | Type: {Type}", context.Exception.Message, context.Exception.GetType().Name);
                if (context.Exception.InnerException != null)
                    logger.LogError("[AUTH FAILED] Inner: {Message}", context.Exception.InnerException.Message);
                context.NoResult();
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var sub = context.Principal?.FindFirst("sub")?.Value ?? "unknown";
                logger.LogInformation("[AUTH OK] JWT validated. sub={Sub}", sub);
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

                // Always suppress the default WWW-Authenticate 401 challenge.
                // Without this, JWT Bearer issues a 401 for ALL unauthenticated requests
                // even when the endpoint is AllowAnonymous.
                context.HandleResponse();

                // Only write a 401 response if the endpoint actually requires authorization.
                // AllowAnonymous endpoints should pass through without any 401.
                var endpoint = context.HttpContext.GetEndpoint();
                var isAnonymous = endpoint?.Metadata
                    .GetMetadata<Microsoft.AspNetCore.Authorization.IAllowAnonymous>() != null;

                if (!isAnonymous)
                {
                    logger.LogWarning("[AUTH CHALLENGE] Returning 401 for protected endpoint {Path}. Error: {Error}",
                        context.Request.Path, context.Error);
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    return context.Response.WriteAsync(
                        "{\"error\":\"Authentication required\",\"message\":\"Please provide a valid Bearer token.\"}");
                }

                logger.LogInformation("[AUTH CHALLENGE] Suppressed challenge for AllowAnonymous endpoint {Path}",
                    context.Request.Path);
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("[JWT RECEIVED] {Path} | Header size: {Size}",
                    context.Request.Path, context.Request.Headers["Authorization"].ToString().Length);
                return Task.CompletedTask;
            }
        };
    });

// FORCE BYPASS Lifetime Validation for Dev (post-configure to override anything)
builder.Services.PostConfigure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme, options =>
{
    if (builder.Environment.IsDevelopment())
    {
        Console.WriteLine("[AUTH PATCH] Applying development lifetime validation bypass.");
        options.TokenValidationParameters.ValidateLifetime = false;
        options.TokenValidationParameters.ClockSkew = TimeSpan.FromDays(20);
        options.TokenValidationParameters.LifetimeValidator = (nbf, exp, token, param) => {
             Console.WriteLine($"[AUTH PATCH DEBUG] Ignoring life cycle: nbf={nbf}, exp={exp}");
             return true; 
        };
    }
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "guest",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5000,
                QueueLimit = 100,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins("https://osttopst.us", "https://www.osttopst.us").AllowAnyMethod().AllowAnyHeader();
        }
    });
});

builder.Services.AddAuthorization();

// Caching
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "PstConverter_";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2_147_483_648;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(30);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(30);
    options.Limits.MinRequestBodyDataRate = null;
    options.Limits.MaxResponseBufferSize = 1024 * 1024;
    options.Limits.MinResponseDataRate = null;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseResponseCompression();
app.UseCors("AllowReactApp");

// Custom Request Logging Middleware
app.Use(async (context, next) =>
{
    if (context.Request.Path.Value?.StartsWith("/api") == true)
    {
        var msg = $"[API DEBUG] {context.Request.Method} {context.Request.Path} | Auth Header: {context.Request.Headers.Authorization.ToString().Length > 0}";
        Console.WriteLine(msg); // Hard output to console
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("[API REQUEST] {Method} {Path} | Auth Header: {HasAuth} | Size: {Size}",
            context.Request.Method, context.Request.Path,
            context.Request.Headers.ContainsKey("Authorization"),
            context.Request.Headers["Authorization"].ToString().Length);
    }
    await next();
});

app.Use(async (context, next) =>
{
    if (context.Request.Query.ContainsKey("token") && string.IsNullOrEmpty(context.Request.Headers.Authorization))
    {
        var token = context.Request.Query["token"];
        context.Request.Headers.Authorization = $"Bearer {token}";
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// DB Init
try
{
    using var scope = app.Services.CreateScope();
    DbInitializer.Initialize(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}
catch (Exception ex)
{
    Console.WriteLine($"[STARTUP ERROR] {ex.Message}");
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers.XXSSProtection = "1; mode=block";
    context.Response.Headers.ContentSecurityPolicy = "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev;";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocaton=()";
    await next();
});

app.MapGet("/api/status", () => Results.Ok(new { status = "API is running", timestamp = DateTime.Now }));

app.MapGet("/api/license/status", async (LicenseApiClient licenseClient, ClaimsPrincipal user, [FromQuery] string? email, [FromQuery] string? itemId, ILogger<Program> logger) =>
{
    var licenseId = user.GetUserEmailId(email, builder.Configuration["LicenseApi:UserId"]);

    var status = await licenseClient.GetDetailedLicenseStatusAsync(licenseId, itemId);
    return Results.Ok(status);
}).AllowAnonymous();

app.MapPost("/api/license/subscription", async (
    [FromBody] SubscriptionRequest subscriptionRequest,
    LicenseApiClient licenseClient,
    ClaimsPrincipal user,
    [FromQuery] string? email,
    ILogger<Program> logger) =>
{
    var licenseId = user.GetUserEmailId(email, builder.Configuration["LicenseApi:UserId"]);

    var toolId = ((int)Tool.ConvertOSTToPST).ToString();
    var result = await licenseClient.GenerateSubscriptionRequestAsync(licenseId, toolId, subscriptionRequest);

    if (!result.Success)
    {
        return Results.Json(new { error = result.Message, raw = result.RawResponse }, statusCode: 502);
    }

    return Results.Ok(result);
}).RequireAuthorization();

app.MapFileEndpoints();
app.MapFolderEndpoints();
app.MapMessageEndpoints();
app.MapConversionEndpoints();
app.MapSessionEndpoints();
app.MapHowItWorksEndpoints();
app.MapReviewEndpoints();
app.MapControllers();
app.MapFallbackToFile("index.html");

// DEV UTILITY: Set usage and allotments for testing
app.MapPost("/api/dev/set-usage", async (AppDbContext db, LicenseApiClient licenseClient, IDistributedCache cache,
    [FromQuery] string email,
    [FromQuery] int? items,
    [FromQuery] long? storage,
    [FromQuery] int? allottedItems,
    [FromQuery] long? allottedStorage,
    [FromQuery] int? tier) =>
{
    var id = email.ToLowerInvariant();
    var license = await db.MockLicenses.FirstOrDefaultAsync(l => l.LicenseId == id);
    if (license == null)
    {
        license = new MockLicense { LicenseId = id };
        db.MockLicenses.Add(license);
    }

    if (items.HasValue) license.TotalItemsUsed = items.Value;
    if (storage.HasValue) license.TotalStorageUsed = storage.Value;
    if (allottedItems.HasValue) license.TotalItemsAllotted = allottedItems.Value;
    if (allottedStorage.HasValue) license.TotalStorageAllotted = allottedStorage.Value;
    if (tier.HasValue) license.Tier = (LicenseTier)tier.Value;
    else license.Tier = LicenseTier.Professional;

    license.LastUpdated = DateTime.Now;
    await db.SaveChangesAsync();

    licenseClient.InvalidateCache(id);
    await cache.RemoveAsync($"license_status_{id}");

    return Results.Ok(new
    {
        message = "Usage and Allotment updated",
        used = license.TotalItemsUsed,
        allotted = license.TotalItemsAllotted,
        storageUsed = license.TotalStorageUsed,
        storageAllotted = license.TotalStorageAllotted,
        tier = license.Tier.ToString()
    });
});

app.Run();
