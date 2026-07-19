# PowerShell Build and Zip Script for cPanel Deployment
param (
    [string]$Env = "stg" # Can be 'stg' or 'prod'
)

$ErrorActionPreference = "Stop"

Write-Host "=== 1. Starting Production Build ===" -ForegroundColor Cyan
npm run build

Write-Host "=== 2. Creating Deployment Archive ===" -ForegroundColor Cyan
$ZipName = "procurebuddy-$Env.zip"

# Remove existing zip if it exists
if (Test-Path $ZipName) {
    Remove-Item $ZipName -Force
    Write-Host "Removed existing $ZipName" -ForegroundColor Yellow
}

# Define files and folders to include
$FilesToZip = @(
    ".next",
    "databases",
    "prisma",
    "public",
    "package.json",
    "package-lock.json",
    "server.js"
)

# Verify all files/folders exist before compressing
foreach ($item in $FilesToZip) {
    if (-not (Test-Path $item)) {
        Write-Error "Required deployment file or folder is missing: $item"
    }
}

# Compress files
Compress-Archive -Path $FilesToZip -DestinationPath $ZipName -Force

Write-Host "=== 3. Done! ===" -ForegroundColor Green
Write-Host "Your deployment package has been generated successfully:" -ForegroundColor Green
Write-Host ">> $ZipName <<" -ForegroundColor Green -FontWeight Bold
Write-Host "You can now upload this ZIP directly to your cPanel directory!" -ForegroundColor Green
