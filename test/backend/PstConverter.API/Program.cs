using PstConverter.Endpoints;
using PstConverter.Services;
using PstConverter.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

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
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IPstStoragePool, PstStoragePool>();
builder.Services.AddScoped<PstService>();
builder.Services.AddHostedService<CleanupBackgroundService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

// MySQL Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

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
            ValidateIssuerSigningKey = true
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError("Authentication failed: {Message}", context.Exception.Message);
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
                // In production, we typically want to allow our specific domain
                // For now, allowing all for ease of deployment, but restricted by Origin in deployment scenarios
                policy.AllowAnyOrigin()
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

app.UseDefaultFiles();
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers.XXSSProtection = "1; mode=block";
    context.Response.Headers.ContentSecurityPolicy = "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev;";
    await next();
});

// Minimal API Test Root
app.MapGet("/api/status", () => Results.Ok(new { status = "API is running", timestamp = DateTime.UtcNow }));

app.MapFileEndpoints();
app.MapFolderEndpoints();
app.MapMessageEndpoints();
app.MapConversionEndpoints();
app.MapSessionEndpoints();
app.MapHowItWorksEndpoints();
app.MapReviewEndpoints();

// Fallback to index.html for SPA-style routing (useful if we serve React from here, though we are decoupled)
app.MapFallbackToFile("index.html");

Console.WriteLine("--- PST Converter API Started ---");
Console.WriteLine("URL: http://localhost:5000");
app.Run();
