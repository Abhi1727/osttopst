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

// Clerk Auth
var clerkConfig = builder.Configuration.GetSection("Clerk");
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = clerkConfig["Authority"];
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            NameClaimType = "sub"
        };
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
}).RequireAuthorization();

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

    license.LastUpdated = DateTime.UtcNow;
    await db.SaveChangesAsync();

    licenseClient.InvalidateCache(id);
    await cache.RemoveAsync($"license_status_{id}");

    return Results.Ok(new { 
        message = "Usage and Allotment updated", 
        used = license.TotalItemsUsed, 
        allotted = license.TotalItemsAllotted,
        storageUsed = license.TotalStorageUsed,
        storageAllotted = license.TotalStorageAllotted,
        tier = license.Tier.ToString()
    });
});

app.Run();
