# 🚀 Quick Reference Guide

## 📦 Common Commands

### Build & Run

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose up -d backend

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend | grep ERROR

# Last 100 lines
docker-compose logs --tail=100

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00
```

### Service Management

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend

# Restart service
docker-compose restart backend

# Remove all containers (keeps volumes)
docker-compose down

# Remove all containers and volumes (WARNING: deletes data)
docker-compose down -v
```

### Database Operations

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u root -p

# Run SQL file
docker-compose exec -T mysql mysql -u root -p < script.sql

# Backup database
docker-compose exec mysql mysqldump -u root -p pstconverter_db > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p pstconverter_db < backup.sql

# Check database status
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
docker-compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Container Operations

```bash
# Execute command in container
docker-compose exec backend sh
docker-compose exec backend dotnet ef database update

# Copy files from container
docker-compose cp backend:/app/logs ./logs

# Copy files to container
docker-compose cp config.json backend:/app/

# View container health
docker inspect pstconverter-backend | grep Health -A 10

# View resource usage
docker stats
```

### Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# See disk usage
docker system df
```

---

## 🔧 Troubleshooting Commands

### Service Not Starting

```bash
# Check logs for errors
docker-compose logs backend | tail -50

# Check health status
docker-compose ps

# Inspect container
docker inspect pstconverter-backend

# Check environment variables
docker-compose exec backend printenv | grep -i mysql
```

### Database Connection Issues

```bash
# Test MySQL connection
docker-compose exec mysql mysql -u root -p -e "SELECT 1;"

# Check if MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# View MySQL error log
docker-compose logs mysql | grep ERROR
```

### Network Issues

```bash
# List networks
docker network ls

# Inspect network
docker network inspect pstconverter_pstconverter-network

# Test connectivity between containers
docker-compose exec backend ping mysql
docker-compose exec frontend ping backend
```

### Port Conflicts

```bash
# Find what's using a port (Windows)
netstat -ano | findstr :3000

# Find what's using a port (Linux/Mac)
lsof -i :3000

# Kill process using port (Windows)
taskkill /PID <pid> /F

# Kill process using port (Linux/Mac)
kill -9 <pid>
```

---

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Change all default passwords in `.env`
- [ ] Use secrets manager (not `.env` file)
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Remove development tools (Swagger, etc.)
- [ ] Enable HTTPS redirect
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Implement rate limiting
- [ ] Enable security headers
- [ ] Scan images for vulnerabilities
- [ ] Set resource limits
- [ ] Use non-root users in containers
- [ ] Enable audit logging

---

## 📊 Monitoring Commands

### Health Checks

```bash
# API status
curl http://localhost:5000/api/status

# Frontend health
curl http://localhost:3000/

# All services
docker-compose ps

# Detailed health
docker inspect --format='{{json .State.Health}}' pstconverter-backend | jq
```

### Performance

```bash
# Container stats
docker stats

# Specific container
docker stats pstconverter-backend

# MySQL performance
docker-compose exec mysql mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
docker-compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"

# Redis stats
docker-compose exec redis redis-cli -a $REDIS_PASSWORD INFO stats
```

---

## 🎯 Environment Variables Quick Reference

### Required Variables

| Variable                     | Description              | Example                               |
| ---------------------------- | ------------------------ | ------------------------------------- |
| `MYSQL_PASSWORD`             | MySQL database password  | `SecurePass123!`                      |
| `CLERK_SECRET_KEY`           | Clerk backend secret key | `sk_live_...`                         |
| `CLERK_AUTHORITY`            | Clerk authority URL      | `https://your-app.clerk.accounts.dev` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key         | `pk_live_...`                         |

### Optional Variables

| Variable         | Description      | Default                 |
| ---------------- | ---------------- | ----------------------- |
| `VITE_API_URL`   | Frontend API URL | `http://localhost:5000` |
| `REDIS_PASSWORD` | Redis password   | -                       |
| `FRONTEND_PORT`  | Frontend port    | `3000`                  |
| `BACKEND_PORT`   | Backend port     | `5000`                  |

---

## 📝 Development Workflow

1. **Make code changes**
2. **Rebuild service**
   ```bash
   docker-compose build --no-cache [service]
   ```
3. **Restart service**
   ```bash
   docker-compose up -d [service]
   ```
4. **View logs**
   ```bash
   docker-compose logs -f [service]
   ```
5. **Test changes**
   ```bash
   curl http://localhost:5000/api/status
   ```

---

## 🚨 Emergency Procedures

### Complete Reset

```bash
# Stop everything
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Restore from Backup

```bash
# Stop services
docker-compose stop

# Restore database
docker-compose exec -T mysql mysql -u root -p pstconverter_db < backup_20240101.sql

# Restart services
docker-compose start
```

### Rollback Deployment

```bash
# Use previous image version
docker-compose down
git checkout <previous-commit>
docker-compose build
docker-compose up -d
```

---

## 🔗 Useful Resources

- **Docker Documentation**: https://docs.docker.com
- **Docker Compose Reference**: https://docs.docker.com/compose/compose-file/
- **Clerk Documentation**: https://clerk.com/docs
- **MySQL Docker Hub**: https://hub.docker.com/_/mysql
- **Redis Docker Hub**: https://hub.docker.com/_/redis

---

## 💡 Pro Tips

1. **Use aliases** for common commands:

   ```bash
   alias dc='docker-compose'
   alias dcl='docker-compose logs -f'
   alias dcp='docker-compose ps'
   ```

2. **Watch logs in real-time**:

   ```bash
   watch -n 1 docker-compose ps
   ```

3. **Pretty print JSON logs**:

   ```bash
   docker-compose logs backend | jq
   ```

4. **Auto-cleanup old images**:
   ```bash
   # Add to crontab
   0 3 * * * docker image prune -a -f --filter "until=168h"
   ```

---

**Updated**: 2024-01-01  
**Version**: 1.0.0
