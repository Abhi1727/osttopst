# ================================
# Stage 1: Build
# ================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Copy project file and restore dependencies (cached layer)
COPY ["PstConverter.API/PstConverter.csproj", "PstConverter.API/"]
RUN dotnet restore "PstConverter.API/PstConverter.csproj"

# Copy source code and license file
COPY PstConverter.API/ PstConverter.API/

# Build and publish the application
WORKDIR "/src/PstConverter.API"
RUN dotnet build "PstConverter.csproj" -c Release -o /app/build
RUN dotnet publish "PstConverter.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ================================
# Stage 2: Runtime
# ================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

# Install required dependencies for Aspose.Email and debugging
RUN apk add --no-cache \
    icu-libs \
    tzdata \
    curl

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/storage /app/logs && \
    chown -R appuser:appuser /app

# Copy published application from build stage
COPY --from=build --chown=appuser:appuser /app/publish .

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:5000 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/status || exit 1

# Start the application
ENTRYPOINT ["dotnet", "PstConverter.dll"]
