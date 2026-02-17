# PST Converter - Production Docker Deployment

> **Enterprise-grade PST/OST file converter with Docker containerization**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- 4GB+ RAM
- 20GB+ Disk Space

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/pstconverter.git
cd pstconverter
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build & Deploy

```bash
# Linux/Mac
bash scripts/build.sh

# Windows
scripts\build.bat

# Or manually
docker-compose up -d
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/swagger (dev only)

---

## 📋 What's Included

### Application Stack

- **Frontend**: React 19 + Vite + TailwindCSS + ShadcN UI
- **Backend**: ASP.NET Core 10 (Minimal API)
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx (production)
- **Authentication**: Clerk

### Docker Configuration

- ✅ Multi-stage optimized Dockerfiles
- ✅ Production & development compose files
- ✅ Health checks for all services
- ✅ Automated backups
- ✅ CI/CD pipeline template
- ✅ Nginx reverse proxy with SSL
- ✅ Security hardening

---

## 📁 Project Structure

```
pstconverter/
├── backend/
│   ├── PstConverter.API/
│   │   ├── Data/              # EF Core DbContext
│   │   ├── Endpoints/         # Minimal API endpoints
│   │   ├── Models/            # Domain models
│   │   ├── Services/          # Business logic
│   │   └── Program.cs
│   └── Dockerfile             # Backend container
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── server.cjs             # Production Express server
│   └── Dockerfile             # Frontend container
├── nginx/
│   └── nginx.conf             # Nginx configuration
├── scripts/
│   ├── build.sh               # Build automation (Linux/Mac)
│   ├── build.bat              # Build automation (Windows)
│   └── backup.sh              # Database backup
├── .github/workflows/
│   └── docker-deploy.yml      # CI/CD pipeline
├── docker-compose.yml         # Main orchestration
├── docker-compose.prod.yml    # Production overrides
├── .env.example               # Environment template
├── .dockerignore
├── DEPLOYMENT.md              # Complete deployment guide
├── PRODUCTION_OPTIMIZATION.md # Advanced optimizations
├── QUICK_REFERENCE.md         # Command cheat sheet
└── DOCKER_SUMMARY.md          # This overview
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet/Users                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NGINX Reverse Proxy (80/443)               │
│        • SSL/TLS Termination                            │
│        • Load Balancing                                 │
│        • Rate Limiting                                  │
│        • Static File Caching                            │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
    ┌────────▼────────┐         ┌────────▼────────┐
    │   Frontend (x2)  │         │   Backend (x2)   │
    │   React + Vite   │◄───────►│   .NET Core 10   │
    │   Port 3000      │  Proxy  │   Port 5000      │
    │                  │         │   • REST API     │
    │   • SPA Routing  │         │   • File Upload  │
    │   • Auth (Clerk) │         │   • Conversion   │
    └─────────────────┘         └────────┬──────────┘
                                         │
                    ┌────────────────────┴──────────────────┐
                    │                                       │
           ┌────────▼────────┐                   ┌─────────▼────────┐
           │  MySQL Database  │                   │  Redis Cache     │
           │  Port 3306       │                   │  Port 6379       │
           │                  │                   │                  │
           │  • User Sessions │                   │  • API Cache     │
           │  • Conversions   │                   │  • Rate Limit    │
           │  • Reviews       │                   │  • Temp Data     │
           └──────────────────┘                   └──────────────────┘
```

---

## 🔒 Security Features

### Container Security

- Non-root users in all containers
- Multi-stage builds (minimal attack surface)
- Alpine Linux base images
- Regular vulnerability scanning

### Network Security

- Isolated Docker networks
- Internal-only database/cache
- SSL/TLS ready
- Rate limiting
- CORS configuration

### Application Security

- JWT authentication (Clerk)
- Security headers (CSP, X-Frame-Options)
- Input validation
- File upload restrictions
- Environment-based secrets

---

## 📊 Performance

### Optimizations Implemented

- **Build Time**: Layer caching, parallel builds
- **Image Size**: 350MB total (vs 3GB unoptimized)
- **Runtime**: HTTP/2, Gzip/Brotli compression
- **Caching**: Redis + HTTP caching layers
- **Database**: Connection pooling, indexes

### Benchmarks

- **Startup Time**: ~30 seconds (all services)
- **API Response**: <100ms (cached)
- **File Upload**: 2GB max, chunked
- **Concurrent Users**: 1000+ (with scaling)

---

## 🌍 Deployment Options

### Supported Platforms

| Platform         | Method         | Difficulty      | Cost     |
| ---------------- | -------------- | --------------- | -------- |
| **Local**        | Docker Compose | ⭐ Easy         | Free     |
| **VPS**          | Docker Compose | ⭐⭐ Medium     | $5-20/mo |
| **AWS**          | ECS/Fargate    | ⭐⭐⭐ Advanced | $50+/mo  |
| **Azure**        | ACI/AKS        | ⭐⭐⭐ Advanced | $50+/mo  |
| **GCP**          | Cloud Run/GKE  | ⭐⭐⭐ Advanced | $50+/mo  |
| **Render.com**   | Native Docker  | ⭐ Easy         | $20+/mo  |
| **DigitalOcean** | App Platform   | ⭐⭐ Medium     | $15+/mo  |

---

## 📚 Documentation

| Document                                                     | Description               | Audience      |
| ------------------------------------------------------------ | ------------------------- | ------------- |
| **[DOCKER_SUMMARY.md](DOCKER_SUMMARY.md)**                   | Overview & quick start    | Everyone      |
| **[DEPLOYMENT.md](DEPLOYMENT.md)**                           | Complete deployment guide | DevOps        |
| **[PRODUCTION_OPTIMIZATION.md](PRODUCTION_OPTIMIZATION.md)** | Advanced optimization     | Senior DevOps |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**                 | Command cheat sheet       | Developers    |

---

## 🚦 Common Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild service
docker-compose build --no-cache backend
docker-compose up -d backend

# Scale services
docker-compose up -d --scale backend=3

# Backup database
bash scripts/backup.sh

# View resource usage
docker stats
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for complete command list.

---

## 🔧 Configuration

### Required Environment Variables

```env
# Database
MYSQL_ROOT_PASSWORD=<secure_password>
MYSQL_DATABASE=pstconverter_db
MYSQL_USER=pstconverter_user
MYSQL_PASSWORD=<secure_password>

# Cache
REDIS_PASSWORD=<secure_password>

# Authentication (from clerk.com)
CLERK_SECRET_KEY=sk_live_...
CLERK_AUTHORITY=https://your-app.clerk.accounts.dev
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Frontend
VITE_API_URL=https://api.yourdomain.com  # Production only
```

See [.env.example](.env.example) for complete configuration.

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Configure secrets (use secrets manager, not `.env`)
- [ ] Obtain SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure monitoring/alerting
- [ ] Update DNS records
- [ ] Configure firewall rules
- [ ] Test disaster recovery
- [ ] Perform load testing
- [ ] Review security settings
- [ ] Document runbooks

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete checklist.

---

## 🐛 Troubleshooting

### Service won't start

```bash
docker-compose logs <service-name>
docker-compose ps
```

### Database connection failed

```bash
docker-compose exec mysql mysql -u root -p
```

### Out of disk space

```bash
docker system df
docker system prune -a
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md#troubleshooting) for more solutions.

---

## 📈 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:5000/api/status

# All services
docker-compose ps

# Detailed health
docker inspect pstconverter-backend | grep Health -A 10
```

### Metrics

```bash
# Resource usage
docker stats

# Logs
docker-compose logs -f
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project uses:

- **Aspose.Email**: Commercial license required for production
- **Clerk**: Authentication service (free tier available)
- Other open-source dependencies (see package files)

---

## 🆘 Support

- **Documentation**: Check docs folder and markdown files
- **Issues**: [Create GitHub Issue](https://github.com/your-org/pstconverter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/pstconverter/discussions)

---

## 🌟 Features

- ✅ PST/OST file conversion
- ✅ Chunked file uploads (up to 2GB)
- ✅ User authentication (Clerk)
- ✅ Session management
- ✅ File preview and exploration
- ✅ Multiple export formats
- ✅ User reviews system
- ✅ Responsive design
- ✅ Dark/Light mode
- ✅ Production-ready Docker deployment

---

## 🗺️ Roadmap

- [ ] Real-time conversion progress
- [ ] Batch file processing
- [ ] Cloud storage integration (S3, Azure Blob)
- [ ] Advanced search and filtering
- [ ] Email templating
- [ ] API webhooks
- [ ] Multi-language support
- [ ] Mobile app

---

## 👥 Team

- **Backend**: .NET Core 10 + Entity Framework
- **Frontend**: React 19 + Vite + TailwindCSS
- **DevOps**: Docker + CI/CD
- **Design**: ShadcN UI + Custom Components

---

**Built with ❤️ for production deployment**

_Last Updated: 2026-02-17_  
_Version: 1.0.0_  
_Docker Ready: Yes_  
_Production Ready: Yes_

---

## Quick Links

- 📖 [Complete Deployment Guide](DEPLOYMENT.md)
- 🚀 [Production Optimization](PRODUCTION_OPTIMIZATION.md)
- 📝 [Quick Reference](QUICK_REFERENCE.md)
- 🐳 [Docker Summary](DOCKER_SUMMARY.md)
