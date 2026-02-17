#!/bin/bash

# ========================================
# Database Backup Script
# ========================================

BACKUP_DIR="./backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Backup database
docker-compose exec -T mysql mysqldump \
    -u root \
    -p$MYSQL_ROOT_PASSWORD \
    --all-databases \
    --single-transaction \
    --quick \
    --lock-tables=false \
    > $BACKUP_DIR/backup_$TIMESTAMP.sql

if [ $? -eq 0 ]; then
    # Compress backup
    gzip $BACKUP_DIR/backup_$TIMESTAMP.sql
    echo "✅ Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
    
    # Delete old backups
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "🗑️  Cleaned up backups older than $RETENTION_DAYS days"
else
    echo "❌ Backup failed!"
    exit 1
fi
