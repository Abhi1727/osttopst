#!/bin/bash

# ========================================
# PST Converter - Docker Build Script
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  PST Converter - Docker Build${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy .env.example to .env and configure it:${NC}"
    echo "   cp .env.example .env"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker and try again.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=(
    "MYSQL_PASSWORD"
    "CLERK_SECRET_KEY"
    "VITE_CLERK_PUBLISHABLE_KEY"
)

echo -e "${YELLOW}🔍 Validating environment variables...${NC}"
MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "   - $VAR"
    done
    echo ""
    echo -e "${YELLOW}Please update your .env file.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"
echo ""

# Build mode selection
MODE=${1:-development}

if [ "$MODE" = "production" ]; then
    echo -e "${YELLOW}🏭 Building for PRODUCTION...${NC}"
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.prod.yml"
else
    echo -e "${YELLOW}💻 Building for DEVELOPMENT...${NC}"
    COMPOSE_FILE="-f docker-compose.yml"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose $COMPOSE_FILE down

# Build images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose $COMPOSE_FILE build --no-cache

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
    
    # Ask if user wants to start containers
    read -p "Start containers now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚀 Starting containers...${NC}"
        docker-compose $COMPOSE_FILE up -d
        
        echo ""
        echo -e "${GREEN}✅ Containers started!${NC}"
        echo ""
        echo -e "${YELLOW}📊 Service Status:${NC}"
        docker-compose ps
        echo ""
        echo -e "${GREEN}🌐 Access the application:${NC}"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:5000"
        echo "   Swagger:  http://localhost:5000/swagger (dev only)"
        echo ""
        echo -e "${YELLOW}📝 View logs:${NC}"
        echo "   docker-compose logs -f"
    fi
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
