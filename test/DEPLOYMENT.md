# 🚀 PST Converter - Production Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Building and Running](#building-and-running)
5. [Production Deployment](#production-deployment)
6. [Cloud Platform Deployment](#cloud-platform-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker**: Version 24.0+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.20+ (usually included with Docker Desktop)
- **Git**: For cloning the repository

### Required Accounts & Services

- **Clerk Account**: For authentication ([Get Clerk API Keys](https://clerk.com))
- **MySQL**: Included in Docker setup (no external service needed)
- **Redis** (Optional): Included in Docker setup for caching

### Hardware Requirements (Minimum)

```
Development:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB

Production (Recommended):
- CPU: 4-8 cores
- RAM: 8-16GB
- Storage: 100GB+ (depends on file storage needs)
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/pstconverter.git
cd pstconverter
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# Windows:
notepad .env

# Linux/Mac:
nano .env
```

**Required variables to update:**

- `MYSQL_ROOT_PASSWORD` - Use a strong password
- `MYSQL_PASSWORD` - Use a strong password
- `REDIS_PASSWORD` - Use a strong password
- `CLERK_SECRET_KEY` - From Clerk Dashboard
- `CLERK_AUTHORITY` - Your Clerk instance URL
- `VITE_CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `VITE_API_URL` - Set to your production API URL

### 3. Build and Run

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/swagger (development only)

---

## Environment Configuration

### Complete `.env` Configuration

```env
# Database
MYSQL_ROOT_PASSWORD=<strong_password_32_chars>
MYSQL_DATABASE=pstconverter_db
MYSQL_USER=pstconverter_user
MYSQL_PASSWORD=<strong_password_32_chars>

# Redis Cache
REDIS_PASSWORD=<strong_password_32_chars>

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx
CLERK_AUTHORITY=https://your-app.clerk.accounts.dev
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxx

# Frontend API URL (Production)
VITE_API_URL=https://api.yourdomain.com
```

### Generating Secure Passwords

```bash
# On Linux/Mac (OpenSSL)
openssl rand -base64 32

# On Windows (PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Alternative: Use an online password generator
# https://passwordsgenerator.net/
```

---

## Building and Running

### Development Mode

```bash
# Start with development configuration
docker-compose up -d

# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a specific service
docker-compose restart backend
```

### Production Mode

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
```

### Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild specific service
docker-compose build --no-cache backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec mysql mysql -u root -p

# View resource usage
docker stats

# Cleanup unused images/containers
docker system prune -a
```

---

## Production Deployment

### 1. Pre-Deployment Checklist

- [ ] All environment variables configured with production values
- [ ] HTTPS/SSL certificates obtained (Let's Encrypt, CloudFlare, etc.)
- [ ] Database backup strategy implemented
- [ ] Monitoring and logging configured
- [ ] Firewall rules configured (only expose necessary ports)
- [ ] DNS records configured
- [ ] Secrets stored in secure vault (not in `.env` file)

### 2. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to Nginx folder
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Uncomment SSL lines in nginx/nginx.conf
```

#### Auto-renewal (Let's Encrypt)

```bash
# Add to crontab
0 3 * * * certbot renew --quiet && docker-compose restart nginx
```

### 3. Firewall Configuration

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH (restrict to specific IPs in production)
sudo ufw enable

# Block direct access to MySQL/Redis (only allow from Docker network)
sudo ufw deny 3306/tcp
sudo ufw deny 6379/tcp
```

### 4. Database Initialization & Migration

```bash
# Run database migrations
docker-compose exec backend dotnet ef database update

# Create database backup
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD pstconverter_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD pstconverter_db < backup_20260217.sql
```

### 5. Aspose.Email License (Optional)

If you have an Aspose.Email license:

```bash
# Place license file
cp Aspose.Email.lic backend/PstConverter.API/

# Uncomment the license volume mount in docker-compose.yml
# - ./backend/PstConverter.API/Aspose.Email.lic:/app/Aspose.Email.lic:ro
```

### 6. Production Startup

```bash
# Pull latest images (if using registry)
docker-compose pull

# Start with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify all services are healthy
docker-compose ps
docker-compose logs --tail=100 -f

# Test health endpoints
curl http://localhost:5000/api/status
curl http://localhost:3000/
```

---

## Cloud Platform Deployment

### AWS (Elastic Container Service)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t pstconverter/backend:latest ./backend
docker tag pstconverter/backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/pstconverter-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/pstconverter-backend:latest

# Use ECS task definition with these images
# Configure RDS for MySQL and ElastiCache for Redis
```

**AWS Services Recommendation:**

- **ECS Fargate**: For container orchestration
- **RDS MySQL**: Managed database
- **ElastiCache Redis**: Managed cache
- **ALB**: Application Load Balancer
- **S3**: File storage for uploads
- **CloudWatch**: Monitoring and logging

### Azure (Container Instances / AKS)

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group
az group create --name pstconverter-rg --location eastus

# Create container registry
az acr create --resource-group pstconverter-rg --name pstconverterregistry --sku Basic

# Build and push
az acr build --registry pstconverterregistry --image pstconverter/backend:latest ./backend
az acr build --registry pstconverterregistry --image pstconverter/frontend:latest ./frontend

# Deploy using Azure Container Instances or AKS
```

**Azure Services Recommendation:**

- **AKS**: Azure Kubernetes Service
- **Azure Database for MySQL**: Managed database
- **Azure Cache for Redis**: Managed cache
- **Azure Application Gateway**: Load balancer
- **Azure Blob Storage**: File storage
- **Application Insights**: Monitoring

### Google Cloud Platform (Cloud Run / GKE)

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Login and set project
gcloud auth login
gcloud config set project pstconverter-project

# Build and push to GCR
gcloud builds submit --tag gcr.io/pstconverter-project/backend ./backend
gcloud builds submit --tag gcr.io/pstconverter-project/frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy pstconverter-backend --image gcr.io/pstconverter-project/backend --platform managed
gcloud run deploy pstconverter-frontend --image gcr.io/pstconverter-project/frontend --platform managed
```

**GCP Services Recommendation:**

- **Cloud Run**: Serverless containers
- **Cloud SQL**: Managed MySQL
- **Memorystore**: Managed Redis
- **Cloud Load Balancing**: Load balancer
- **Cloud Storage**: File storage
- **Cloud Monitoring**: Observability

### DigitalOcean (App Platform)

```bash
# Install doctl
brew install doctl  # Mac
snap install doctl  # Linux

# Login
doctl auth init

# Create app (use App Platform UI or spec file)
doctl apps create --spec app-spec.yaml
```

### Render.com (Easiest Option)

1. Connect your GitHub repository
2. Create a new **Web Service** for backend
3. Create a new **Static Site** for frontend
4. Add managed **PostgreSQL** or **MySQL** database
5. Add managed **Redis** instance
6. Configure environment variables in dashboard

**Advantages**: Auto-deploy on git push, free SSL, simple pricing

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all service health
curl http://localhost:5000/api/status
curl http://localhost:3000/

# Docker health status
docker-compose ps
docker inspect <container-id> | grep Health -A 10
```

### Logging

```bash
# View logs
docker-compose logs -f --tail=100

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f mysql

# Export logs
docker-compose logs --no-color > application.log
```

### Database Backup

```bash
# Automated backup script (save as backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T mysql mysqldump \
  -u root \
  -p$MYSQL_ROOT_PASSWORD \
  --all-databases \
  --single-transaction \
  --quick \
  --lock-tables=false \
  > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

# Add to crontab for daily backups
# 0 2 * * * /path/to/backup.sh
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database performance
docker-compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
docker-compose exec mysql mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G"

# Redis statistics
docker-compose exec redis redis-cli -a $REDIS_PASSWORD INFO stats
```

### Updates & Patches

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart with zero downtime (using rolling update)
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

---

## Troubleshooting

### Common Issues

#### 1. Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database not ready: Wait for MySQL health check
# - Missing Aspose license: Remove or provide valid license
# - Environment variables: Check .env file
```

#### 2. Frontend build fails

```bash
# Check if environment variables are set during build
docker-compose build --no-cache frontend

# Manually test build
cd frontend
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY .
```

#### 3. Database connection errors

```bash
# Verify MySQL is running
docker-compose ps mysql

# Test connection
docker-compose exec mysql mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -e "SELECT 1;"

# Check connection string in backend
docker-compose exec backend printenv | grep ConnectionStrings
```

#### 4. Out of disk space

```bash
# Check disk usage
df -h
docker system df

# Clean up
docker system prune -a --volumes
docker volume prune
```

#### 5. Port already in use

```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Change port mapping in docker-compose.yml or stop conflicting service
```

### Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/your-org/pstconverter/issues)
- **Docker Logs**: Always include `docker-compose logs` when reporting issues
- **Health Status**: Include output of `docker-compose ps`

---

## Security Best Practices

1. ✅ Never commit `.env` file to version control
2. ✅ Use strong, unique passwords for all services
3. ✅ Enable SSL/TLS in production
4. ✅ Restrict database access to Docker network only
5. ✅ Regular security updates: `docker-compose pull`
6. ✅ Use secrets management (AWS Secrets Manager, HashiCorp Vault)
7. ✅ Enable firewall rules
8. ✅ Regular backups
9. ✅ Monitor access logs
10. ✅ Implement rate limiting (included in Nginx config)

---

## Performance Optimization

### Database Optimization

```sql
-- Run these in MySQL
-- Add indexes for frequently queried fields
CREATE INDEX idx_session_id ON ConversionSessions(SessionId);
CREATE INDEX idx_created_at ON ConversionSessions(CreatedAt);

-- Optimize tables
OPTIMIZE TABLE ConversionSessions;
OPTIMIZE TABLE Reviews;
```

### File Storage Optimization

```bash
# Use object storage (S3, Azure Blob) instead of local volumes
# Update backend to use S3-compatible storage
# This allows horizontal scaling
```

### Scaling Strategy

```bash
# Horizontal scaling
docker-compose up -d --scale backend=3 --scale frontend=2

# Load balancing handled by docker-compose and nginx
# For production, use Kubernetes or managed container services
```

---

## License & Attribution

- **Aspose.Email**: Commercial license required for production use
- **Clerk**: Authentication service (pricing tiers available)
- **Docker**: Open source (Docker Desktop may require license for commercial use)

---

**Need more help?** Check the [GitHub Wiki](https://github.com/your-org/pstconverter/wiki) or contact support.
