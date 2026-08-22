#!/bin/bash
# Staging Deployment Script for ProcureBuddy
# Run this from your user home directory where 'procurebuddy-stg.zip' is uploaded

set -e

ZIP_FILE="$HOME/procurebuddy-stg.zip"
APP_DIR="/var/www/procurebuddy"

if [ ! -f "$ZIP_FILE" ]; then
    echo "Error: $ZIP_FILE not found! Please upload your zip file first."
    exit 1
fi

echo "=== 0. Stopping Running Application ==="
pm2 stop procurebuddy || true

echo "=== 1. Backing Up Existing Databases (Anti-Data Loss) ==="
if [ -d "$APP_DIR/databases" ]; then
    echo "Found existing client databases. Backing up..."
    rm -rf /tmp/databases_backup
    cp -r "$APP_DIR/databases" /tmp/databases_backup
fi

echo "=== 2. Clearing Application Folder ==="
# Explicitly delete only the folders/files that will be overwritten by the ZIP
# This avoids traversing node_modules or databases, making cleanup instant (0.01s)
rm -rf "$APP_DIR/src" "$APP_DIR/.next" "$APP_DIR/scripts" "$APP_DIR/public" "$APP_DIR/prisma" "$APP_DIR/server.js" "$APP_DIR/package.json" "$APP_DIR/package-lock.json" "$APP_DIR/next.config.ts" "$APP_DIR/tsconfig.json" "$APP_DIR/postcss.config.mjs" "$APP_DIR/eslint.config.mjs"

echo "=== 3. Extracting Archive ==="
unzip -o "$ZIP_FILE" -d $APP_DIR || true
# Ensure all extracted directories have read and traverse permissions (+rX)
chmod -R +rX $APP_DIR

echo "=== 4. Restoring Database Backups ==="
if [ -d "/tmp/databases_backup" ]; then
    echo "Restoring client databases..."
    rm -rf "$APP_DIR/databases"
    cp -r /tmp/databases_backup "$APP_DIR/databases"
    rm -rf /tmp/databases_backup
fi

echo "=== 5. Installing Dependencies ==="
cd $APP_DIR
# Run a full install to get build tools. This is fast since packages are cached!
npm install

echo "=== 6. Generating database client engines ==="
npx prisma generate

echo "=== 6.3. Running Database Schema Migrations ==="
node scripts/migrate.js

echo "=== 6.5. Skipping Next Build (Pre-compiled locally) ==="
# Build is precompiled locally and shipped via the ZIP archive to save time.

echo "=== 7. Starting/Restarting Application via PM2 ==="
pm2 describe procurebuddy > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Restarting active PM2 process..."
    pm2 restart procurebuddy
else
    echo "Starting new PM2 process..."
    pm2 start server.js --name "procurebuddy" --env NODE_ENV=production
fi

# Save PM2 process list to start automatically on server boot
pm2 save

echo "=== Deployment Completed Successfully! ==="
echo "You can check application logs with: pm2 logs procurebuddy"
