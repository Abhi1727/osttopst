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

// Aspose License will be initialized after builder creation to read from appsettings.json


var builder = WebApplication.CreateBuilder(args);

// Initialize Aspose Licenses from appsettings.json
var asposeLicenseString = builder.Configuration["Aspose:License"];
if (!string.IsNullOrEmpty(asposeLicenseString))
{
    try
    {
        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(asposeLicenseString));
        
        // Apply to Aspose.Email
        new Aspose.Email.License().SetLicense(ms);
        
        // Apply to Aspose.Words
        ms.Position = 0;
        new Aspose.Words.License().SetLicense(ms);
        
        // Apply to Aspose.Zip
        ms.Position = 0;
        new Aspose.Zip.License().SetLicense(ms);

        Console.WriteLine("[ASPOSE] Licenses applied successfully from appsettings.json");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ASPOSE] Error applying license: {ex.Message}");
    }
}
else
{
    Console.WriteLine("[ASPOSE] No license string found in appsettings.json. Running in evaluation mode.");
}


// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IPstStoragePool, PstStoragePool>();
builder.Services.AddSingleton<R2StorageProvider>();
builder.Services.AddSingleton<IHybridStorageService, HybridStorageService>();
builder.Services.AddSingleton<IFileCleanupQueue, FileCleanupQueue>();
builder.Services.AddSingleton<DownloadCleanup>();

builder.Services.AddScoped<PstService>();
builder.Services.AddScoped<IImageKitService, ImageKitService>();
builder.Services.AddHostedService<CleanupBackgroundService>();
builder.Services.AddSingleton<LicenseAuthService>();
builder.Services.AddSingleton<LicenseApiClient>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    // We EXCLUDE large binary formats like PST/OST/ZIP from compression 
    // because compressing 10GB+ files on-the-fly crushes server CPU and slows down transfer rates.
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// SQL Server Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null))
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Clerk Authentication
var clerkConfig = builder.Configuration.GetSection("Clerk");
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = clerkConfig["Authority"];
        options.MapInboundClaims = false; // Prevent claim renaming to URI schemas
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false, // Clerk doesn't strictly require audience validation for simple setups
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            NameClaimType = "sub" // Map Clerk 'sub' claim to Identity.Name
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError("Authentication failed: {Message}. Exception: {Exception}", context.Exception.Message, context.Exception.ToString());
                
                // Log details about the failure to help identify issuer or audience mismatches
                if (context.Exception is Microsoft.IdentityModel.Tokens.SecurityTokenInvalidIssuerException issuerEx)
                {
                    logger.LogError("Invalid Issuer: {Issuer}", issuerEx.InvalidIssuer);
                }
                
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Token validated successfully for user: {User}", context.Principal?.Identity?.Name ?? "unknown");
                }
                return Task.CompletedTask;
            }
        };
    });

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5000,// for 1 minute
                QueueLimit = 100,// if more than 100 requests come in 1 minute then reject
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new { error = "Too many requests. Please try again later." }, token);
    };
});

// Add CORS 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
            else
            {
                // Tighten CORS for production using configuration
                var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
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

// Configure upload limit per request (chunked uploads use ~100MB chunks)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2_147_483_648; // 2 GB per chunk request
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(30);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(30);
    options.Limits.MinRequestBodyDataRate = null; // Disable minimum data rate for slow uploads

    // Performance tuning for large file downloads
    options.Limits.MaxResponseBufferSize = 1024 * 1024; // 1MB buffer
    options.Limits.MinResponseDataRate = null; // Don't kill slow connections
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseResponseCompression();
app.UseCors("AllowReactApp");

// Middleware to support token in query string for downloads
app.Use(async (context, next) =>
{
    if (context.Request.Query.ContainsKey("token") &&
        string.IsNullOrEmpty(context.Request.Headers.Authorization))
    {
        var token = context.Request.Query["token"];
        context.Request.Headers.Authorization = $"Bearer {token}";
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Initialize Database Schema (Add missing columns if needed)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers.XXSSProtection = "1; mode=block";
    // CSP is handled by Frontend/Nginx to avoid conflicts
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocaton=()";
    await next();
});

// Minimal API Test Root
app.MapGet("/api/status", () => Results.Ok(new { status = "API is running", timestamp = DateTime.Now }));

// License server connectivity test
app.MapGet("/api/license/test", async (LicenseApiClient licenseClient, IConfiguration config) =>
{
    var userId = config["LicenseApi:UserId"] ?? "test";
    var toolId = config["LicenseApi:ToolId"] ?? "1";
    var result = await licenseClient.GetLicenceStatus(userId);
    return Results.Ok(new { userId, toolId, response = result });
});

app.MapGet("/api/license/status", async (LicenseApiClient licenseClient, ClaimsPrincipal user, [FromQuery] string? email, ILogger<Program> logger) =>
{
    var licenseId = email
                 ?? user.FindFirstValue(ClaimTypes.Email)
                 ?? user.FindFirstValue("email")
                 ?? user.FindFirstValue("sub")
                 ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? "anonymous";

    if (logger.IsEnabled(LogLevel.Information))
    {
        logger.LogInformation("[LICENSE REQ] Using License ID: {LicenseId} (Source: {Source})",
            licenseId,
            email != null ? "QueryParam" : (user.FindFirstValue(ClaimTypes.Email) != null ? "ClaimTypes.Email" : "Fallback"));
    }

    try
    {
        var status = await licenseClient.GetDetailedLicenseStatusAsync(licenseId);
        return Results.Ok(status);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[LICENSE STATUS] Unhandled exception for {LicenseId} - returning fallback", licenseId);
        return Results.Ok(new
        {
            tier = "Demo",
            canConvert = true,
            hitFileCountLimit = false,
            hitSizeLimit = false,
            hitTimePeriodLimit = false,
            totalItemsAllotted = 50,
            totalItemsUsed = 0,
            totalStorageAllotted = 524288000L,
            totalStorageUsed = 0L,
            exportFileLimit = 3
        });
    }
});

app.MapPost("/api/license/subscription", async (
    LicenseApiClient licenseClient,
    ClaimsPrincipal user,
    [FromQuery] string? email,
    [FromBody] PstConverter.Models.SubscriptionRequest requestBody,
    ILogger<Program> logger) =>
{
    var licenseId = email
                 ?? user.FindFirstValue(ClaimTypes.Email)
                 ?? user.FindFirstValue("email")
                 ?? user.FindFirstValue("sub")
                 ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? "anonymous";

    if (logger.IsEnabled(LogLevel.Information))
    {
        logger.LogInformation("[LICENSE SUB] Subscription request for: {LicenseId}", licenseId);
    }

    var result = await licenseClient.GenerateSubscriptionRequestAsync(licenseId, requestBody);
    return Results.Ok(result);
});


app.MapFileEndpoints();
app.MapFolderEndpoints();
app.MapMessageEndpoints();
app.MapConversionEndpoints();
app.MapStorageEndpoints();
app.MapSessionEndpoints();


app.MapControllers(); // Register attribute-routed API controllers like BlogsController

// Fallback to index.html for SPA-style routing (useful if we serve React from here, though we are decoupled)
app.MapFallbackToFile("index.html");

Console.WriteLine("=================================================");
Console.WriteLine("   PST CONVERTER API - SYSTEM READY             ");
Console.WriteLine("=================================================");
Console.WriteLine($"URL: http://localhost:5000");
Console.WriteLine($"Time: {DateTime.Now}");
Console.WriteLine("-------------------------------------------------");
app.Run();
