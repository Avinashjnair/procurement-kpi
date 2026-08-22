#!/bin/bash
# Bash Build and Zip Script for cPanel Deployment

ENV=${1:-stg}
ZIP_NAME="procurebuddy-$ENV.zip"

echo "=== 1. Starting Production Build ==="
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed! Aborting."
  exit 1
fi

echo "=== 2. Creating Deployment Archive ==="
# Remove existing zip if it exists
if [ -f "$ZIP_NAME" ]; then
  rm "$ZIP_NAME"
  echo "Removed existing $ZIP_NAME"
fi

# Clean development cache folders from .next to keep the zip archive clean
rm -rf .next/cache
rm -rf .next/dev
echo "Cleaned dev and cache folders from .next"

# Zip folders and files (excluding node_modules, .git, etc.)
zip -r "$ZIP_NAME" .next databases prisma public package.json package-lock.json server.js scripts docs

if [ $? -eq 0 ]; then
  echo "=== 3. Done! ==="
  echo "Your deployment package has been generated successfully:"
  echo ">> $ZIP_NAME <<"
  echo "You can now upload this ZIP directly to your cPanel directory!"
else
  echo "Compression failed!"
  exit 1
fi
