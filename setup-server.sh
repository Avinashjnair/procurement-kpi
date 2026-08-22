#!/bin/bash
# VM Server Setup Script for ProcureBuddy
# Run this as root on your Ubuntu VM

set -e

DOMAIN="stg.procurebuddy.veltrixlabs.in"
APP_DIR="/var/www/procurebuddy"

echo "=== 1. Updating System Packages ==="
sudo apt-get update
sudo apt-get upgrade -y

echo "=== 2. Creating 2GB Swap Space ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap space created successfully!"
else
    echo "Swap space already exists."
fi

echo "=== 3. Installing Node.js & Essential Tools ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs unzip nginx git certbot python3-certbot-nginx build-essential

# Verify versions
node -v
npm -v

# 4. Setting Up Application Directory
sudo mkdir -p $APP_DIR
sudo chown -R ${SUDO_USER:-$USER}:${SUDO_USER:-$USER} $APP_DIR

echo "=== 5. Installing PM2 (Process Manager) ==="
sudo npm install -p -g pm2

echo "=== 6. Configuring Nginx Reverse Proxy ==="
cat <<EOF | sudo tee /etc/nginx/sites-available/procurebuddy
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/procurebuddy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "=== 7. Restarting Nginx ==="
sudo systemctl restart nginx

echo "=== Setup complete! ==="
echo "Next step: Upload your 'procurebuddy-stg.zip' file to your home directory, then run the deploy script."
