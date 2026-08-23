#!/bin/bash
# Deployment Script for ProcureBuddy (stg / prod)
# Usage: ./deploy-app.sh [stg|prod]

set -e

ENV=${1:-stg}
PORT=3000
if [ "$ENV" = "prod" ]; then
    PORT=3001
fi

ZIP_FILE="$HOME/procurebuddy-$ENV.zip"
APP_DIR="/var/www/procurebuddy-$ENV"
PROCESS_NAME="procurebuddy-$ENV"

echo "=== deploying to environment: $ENV (Port: $PORT) ==="

# Create directory if it doesn't exist
mkdir -p "$APP_DIR"

echo "=== 0. Stopping Running Application ==="
pm2 stop "$PROCESS_NAME" || true

echo "=== 1. Backing Up Existing Databases (Anti-Data Loss) ==="
if [ -d "$APP_DIR/databases" ]; then
    echo "Found existing client databases. Backing up..."
    rm -rf /tmp/databases_backup
    cp -r "$APP_DIR/databases" /tmp/databases_backup
fi

# If zip file exists in home folder, extract it (used for manual deployment)
if [ -f "$ZIP_FILE" ]; then
    echo "=== 2. Clearing Application Folder ==="
    rm -rf "$APP_DIR/src" "$APP_DIR/.next" "$APP_DIR/scripts" "$APP_DIR/public" "$APP_DIR/prisma" "$APP_DIR/server.js" "$APP_DIR/package.json" "$APP_DIR/package-lock.json" "$APP_DIR/next.config.ts" "$APP_DIR/tsconfig.json" "$APP_DIR/postcss.config.mjs" "$APP_DIR/eslint.config.mjs"
    
    echo "=== 3. Extracting Archive ==="
    unzip -o "$ZIP_FILE" -d "$APP_DIR" || true
    rm "$ZIP_FILE" # Clean up zip after extraction
fi

# Ensure all directory permissions are correct
chmod -R +rX "$APP_DIR"

echo "=== 4. Restoring Database Backups ==="
if [ -d "/tmp/databases_backup" ]; then
    echo "Restoring client databases..."
    rm -rf "$APP_DIR/databases"
    cp -r /tmp/databases_backup "$APP_DIR/databases"
    rm -rf /tmp/databases_backup
fi

# Dependencies and native modules are pre-compiled in CI. Skipping install steps.

# Prisma Client is pre-generated in CI. Skipping generation on the VM.

echo "=== 6.3. Running Database Schema Migrations ==="
node scripts/migrate.js

# Next Build is pre-compiled in CI and copied over inside the archive. Skipping native build.

echo "=== 7. Starting/Restarting Application via PM2 ==="
pm2 describe "$PROCESS_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Restarting active PM2 process..."
    PORT=$PORT pm2 restart "$PROCESS_NAME" --update-env
else
    echo "Starting new PM2 process..."
    PORT=$PORT pm2 start server.js --name "$PROCESS_NAME" --env NODE_ENV=production
fi

# Save PM2 process list to start automatically on server boot
pm2 save

echo "=== Deployment Completed Successfully! ==="
echo "Staging environment is running on port: $PORT"
echo "You can check application logs with: pm2 logs $PROCESS_NAME"
