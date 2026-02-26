using PstConverter.Endpoints; // This is for endpoints
using PstConverter.Services; // This is for services
using PstConverter.Data; // This is for data
using Microsoft.EntityFrameworkCore; // This is for database
using System.Threading.RateLimiting; // This is for rate limiting
using Microsoft.Extensions.DependencyInjection; // This is for dependency injection

// Initialize Aspose.Email License
try
{
    var license = new Aspose.Email.License();
    if (File.Exists("Aspose.Email.lic"))
    {
        license.SetLicense("Aspose.Email.lic");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Aspose.Email License Error: {ex.Message}");
}

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddMemoryCache();// This is for memory cache
builder.Services.AddSingleton<IPstStoragePool, PstStoragePool>();// This is for storage pool
builder.Services.AddScoped<PstService>();// This is for pst service
builder.Services.AddHostedService<CleanupBackgroundService>();// This is for cleanup background service
builder.Services.AddEndpointsApiExplorer();// This is for endpoints api explorer
builder.Services.AddSwaggerGen();// This is for swagger gen
builder.Services.AddOpenApi();

// MySQL Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var serverVersion = ServerVersion.AutoDetect(connectionString); // Detect once at startup
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

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
                PermitLimit = 100,
                QueueLimit = 20,
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
                policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
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
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

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

app.MapFileEndpoints();
app.MapFolderEndpoints();
app.MapMessageEndpoints();
app.MapConversionEndpoints();
app.MapSessionEndpoints();
app.MapHowItWorksEndpoints();
app.MapReviewEndpoints();

// Fallback to index.html for SPA-style routing (useful if we serve React from here, though we are decoupled)
app.MapFallbackToFile("index.html");

Console.WriteLine("=================================================");
Console.WriteLine("   PST CONVERTER API - SYSTEM READY             ");
Console.WriteLine("=================================================");
Console.WriteLine($"URL: http://localhost:5000");
Console.WriteLine($"Time: {DateTime.Now}");
Console.WriteLine("-------------------------------------------------");
app.Run();
