using System.Text;
using System.Security.Claims;
using Aspose.Email;
using PstConverter.Endpoints; // This is for endpoints
using PstConverter.Services; // This is for services
using PstConverter.Data; // This is for data
using Microsoft.EntityFrameworkCore; // This is for database
using System.Threading.RateLimiting; // This is for rate limiting
using Microsoft.Extensions.DependencyInjection; // This is for dependency injection
using Microsoft.AspNetCore.Mvc; // This is for [FromQuery] and other MVC attributes
using Microsoft.AspNetCore.ResponseCompression;

// Initialize Aspose.Email License
try
{
    var license = new License();

    //  License licObj = new License();
    // string Lic = "<?xml version=\\\"1.0\\\"?>\\r\\n<License>\\r\\n  <Data>\\r\\n    <LicensedTo>Shef USA</LicensedTo>\\r\\n    <EmailTo>tarunlamba@shefusa.com</EmailTo>\\r\\n    <LicenseType>Developer OEM</LicenseType>\\r\\n    <LicenseNote>1 Developer And Unlimited Deployment Locations</LicenseNote>\\r\\n    <OrderID>260226165350</OrderID>\\r\\n    <UserID>1327979</UserID>\\r\\n    <OEM>This is a redistributable license</OEM>\\r\\n    <Products>\\r\\n      <Product>Aspose.Total Product Family</Product>\\r\\n    </Products>\\r\\n    <EditionType>Professional</EditionType>\\r\\n    <SerialNumber>b9f2d0d5-bdef-4f1d-968d-4cdd2111ade2</SerialNumber>\\r\\n    <SubscriptionExpiry>20270226</SubscriptionExpiry>\\r\\n    <LicenseExpiry>20260326</LicenseExpiry>\\r\\n    <ExpiryNote>This is a temporary license for non-commercial use only and it will expire on 2026-03-26</ExpiryNote>\\r\\n    <LicenseVersion>3.0</LicenseVersion>\\r\\n    <LicenseInstructions>https://purchase.aspose.com/policies/use-license</LicenseInstructions>\\r\\n  </Data>\\r\\n  <Signature>mFYcemoPfrXsGUWnC0oT2uR289LbOmnbnSNh3b756tCIeWVAJw5jivY236zdzaoU0+gyu8CnQq9Soiwz93HF6ychmsiqUaBcH/8EDTQqom1E/19rAKkSoDBpOwLO6sgl4CX2EmE3IdxTKzEd78j85fmUHSSql9WpW+UASSId/EE=</Signature>\\r\\n</License>";
    string Lic = "<?xml version=\"1.0\"?>\r\n<License>\r\n  <Data>\r\n    <LicensedTo>Shef USA</LicensedTo>\r\n    <EmailTo>tarunlamba@shefusa.com</EmailTo>\r\n    <LicenseType>Developer OEM</LicenseType>\r\n    <LicenseNote>1 Developer And Unlimited Deployment Locations</LicenseNote>\r\n    <OrderID>260226165350</OrderID>\r\n    <UserID>1327979</UserID>\r\n    <OEM>This is a redistributable license</OEM>\r\n    <Products>\r\n      <Product>Aspose.Total Product Family</Product>\r\n    </Products>\r\n    <EditionType>Professional</EditionType>\r\n    <SerialNumber>b9f2d0d5-bdef-4f1d-968d-4cdd2111ade2</SerialNumber>\r\n    <SubscriptionExpiry>20270226</SubscriptionExpiry>\r\n    <LicenseExpiry>20260326</LicenseExpiry>\r\n    <ExpiryNote>This is a temporary license for non-commercial use only and it will expire on 2026-03-26</ExpiryNote>\r\n    <LicenseVersion>3.0</LicenseVersion>\r\n    <LicenseInstructions>https://purchase.aspose.com/policies/use-license</LicenseInstructions>\r\n  </Data>\r\n  <Signature>mFYcemoPfrXsGUWnC0oT2uR289LbOmnbnSNh3b756tCIeWVAJw5jivY236zdzaoU0+gyu8CnQq9Soiwz93HF6ychmsiqUaBcH/8EDTQqom1E/19rAKkSoDBpOwLO6sgl4CX2EmE3IdxTKzEd78j85fmUHSSql9WpW+UASSId/EE=</Signature>\r\n</License>";
    byte[] byteArray = Encoding.UTF8.GetBytes(Lic);
    MemoryStream objStream = new(byteArray);

    license.SetLicense(objStream);
    try
    {
        var logPath = @"C:\temp\debug_log.txt";
        File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] Aspose.Email License applied successfully.{Environment.NewLine}");
    }
    catch { }


    //if (File.Exists("Aspose.Email.lic"))
    //{
    //    license.SetLicense("Aspose.Email.lic");
    //}
}
catch (Exception ex)
{
    Console.WriteLine($"Aspose.Email License Error: {ex.Message}");
}

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddMemoryCache();// This is for memory cache
builder.Services.AddSingleton<IPstStoragePool, PstStoragePool>();// This is for storage pool
builder.Services.AddScoped<PstService>();// This is for pst service
builder.Services.AddHostedService<CleanupBackgroundService>();// This is for cleanup background service
builder.Services.AddSingleton<LicenseAuthService>();// License auth (token caching)
builder.Services.AddSingleton<LicenseApiClient>();// License API wrapper
builder.Services.AddEndpointsApiExplorer();// This is for endpoints api explorer
builder.Services.AddSwaggerGen();// This is for swagger gen
builder.Services.AddOpenApi();// This is for open api

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
                logger.LogError("Authentication failed: {Message}", context.Exception.Message);
                try
                {
                    var logPath = @"C:\temp\debug_log.txt";
                    File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] AUTH FAILED: {context.Exception.Message}{Environment.NewLine}");
                }
                catch { }
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Token validated successfully for user: {User}", context.Principal?.Identity?.Name);
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
                PermitLimit = 5000,
                QueueLimit = 100,
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
                // Tighten CORS for production
                policy.WithOrigins("https://osttopst.us", "https://www.osttopst.us")
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
    app.MapOpenApi();
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
    context.Response.Headers.ContentSecurityPolicy = "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev;";
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
    // Prioritize email address passed from frontend, otherwise fallback to JWT claims
    var licenseId = email
                 ?? user.FindFirstValue(ClaimTypes.Email)
                 ?? user.FindFirstValue("email")
                 ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? "anonymous";

    if (logger.IsEnabled(LogLevel.Information))
    {
        logger.LogInformation("[LICENSE REQ] Using License ID: {LicenseId} (Source: {Source})",
            licenseId,
            email != null ? "QueryParam" : (user.FindFirstValue(ClaimTypes.Email) != null ? "ClaimTypes.Email" : "Fallback"));
    }

    var status = await licenseClient.GetDetailedLicenseStatusAsync(licenseId, null);
    return Results.Ok(status);
});


app.MapFileEndpoints();
app.MapFolderEndpoints();
app.MapMessageEndpoints();
app.MapConversionEndpoints();
app.MapSessionEndpoints();
app.MapHowItWorksEndpoints();
app.MapReviewEndpoints();

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
