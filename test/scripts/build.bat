@echo off
REM ========================================
REM PST Converter - Docker Build Script
REM ========================================

echo ========================================
echo   PST Converter - Docker Build
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it:
    echo    copy .env.example .env
    echo.
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Build mode selection
set MODE=%1
if "%MODE%"=="" set MODE=development

if /i "%MODE%"=="production" (
    echo [INFO] Building for PRODUCTION...
    set COMPOSE_FILE=-f docker-compose.yml -f docker-compose.prod.yml
) else (
    echo [INFO] Building for DEVELOPMENT...
    set COMPOSE_FILE=-f docker-compose.yml
)
echo.

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose %COMPOSE_FILE% down

REM Build images
echo [INFO] Building Docker images...
docker-compose %COMPOSE_FILE% build --no-cache

if errorlevel 1 (
    echo [ERROR] Build failed!
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully!
echo.

REM Ask if user wants to start containers
set /p START="Start containers now? (y/n): "
if /i "%START%"=="y" (
    echo [INFO] Starting containers...
    docker-compose %COMPOSE_FILE% up -d
    
    echo.
    echo [SUCCESS] Containers started!
    echo.
    echo Service Status:
    docker-compose ps
    echo.
    echo Access the application:
    echo    Frontend: http://localhost:3000
    echo    Backend:  http://localhost:5000
    echo    Swagger:  http://localhost:5000/swagger (dev only)
    echo.
    echo View logs:
    echo    docker-compose logs -f
)

echo.
pause
