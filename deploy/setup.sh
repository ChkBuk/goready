#!/usr/bin/env bash
# ============================================================
# GoReady — Hetzner VPS Setup Script
# Run this ON THE SERVER after a fresh Ubuntu 22.04/24.04 install
# Usage: bash setup.sh yourdomain.com
# ============================================================
set -e

DOMAIN="${1:?Usage: bash setup.sh yourdomain.com}"
APP_USER="goready"
APP_DIR="/home/$APP_USER/app"
NODE_VERSION="20"

echo "========================================="
echo "  GoReady Server Setup"
echo "  Domain: $DOMAIN"
echo "========================================="

# ── 1. System updates ──
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# ── 2. Install Node.js 20 LTS ──
echo "[2/8] Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# ── 3. Install PostgreSQL ──
echo "[3/8] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# ── 4. Install Nginx + Certbot ──
echo "[4/8] Installing Nginx & Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# ── 5. Install PM2 ──
echo "[5/8] Installing PM2..."
npm install -g pm2

# ── 6. Create app user ──
echo "[6/8] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" $APP_USER
fi
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER /home/$APP_USER

# ── 7. Set up PostgreSQL database ──
echo "[7/8] Setting up database..."
sudo -u postgres psql -c "CREATE USER $APP_USER WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE goready OWNER $APP_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE goready TO $APP_USER;" 2>/dev/null || true

# ── 8. Configure Nginx ──
echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/goready <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }

    # Uploaded files
    location /uploads/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/goready /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── Firewall ──
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "========================================="
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Update the DB password in this script and in .env"
echo "  2. Deploy your code (see deploy.sh)"
echo "  3. Run: certbot --nginx -d $DOMAIN"
echo "  4. Done!"
echo "========================================="
