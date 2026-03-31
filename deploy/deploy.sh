#!/usr/bin/env bash
# ============================================================
# GoReady — Deploy Script
# Run this FROM YOUR LOCAL MACHINE to deploy to Hetzner
# Usage: bash deploy/deploy.sh user@your-server-ip yourdomain.com
# ============================================================
set -e

SERVER="${1:?Usage: bash deploy/deploy.sh user@server-ip yourdomain.com}"
DOMAIN="${2:?Usage: bash deploy/deploy.sh user@server-ip yourdomain.com}"
APP_USER="goready"
APP_DIR="/home/$APP_USER/app"

echo "Deploying GoReady to $SERVER..."

# ── 1. Build locally ──
echo "[1/4] Building locally..."
cd "$(dirname "$0")/.."

# Build client
cd client && npm run build && cd ..

# ── 2. Sync files to server ──
echo "[2/4] Syncing files to server..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='server/uploads/*' \
  ./ $SERVER:$APP_DIR/

# ── 3. Install dependencies & build on server ──
echo "[3/4] Installing dependencies on server..."
ssh $SERVER << 'REMOTE'
  set -e
  APP_DIR="/home/goready/app"
  cd $APP_DIR

  # Install dependencies
  cd server && npm install --production && cd ..
  cd client && npm install && cd ..
  cd shared && npm install && cd ..

  # Build client on server
  cd client && npm run build && cd ..

  # Ensure uploads dir exists
  mkdir -p server/uploads

  # Push database schema
  cd server && npx drizzle-kit push --force && cd ..
REMOTE

# ── 4. Restart with PM2 ──
echo "[4/4] Restarting services..."
ssh $SERVER << REMOTE
  set -e
  cd $APP_DIR

  # Stop existing processes
  pm2 delete goready-api 2>/dev/null || true
  pm2 delete goready-web 2>/dev/null || true

  # Start backend
  cd server
  pm2 start "node --env-file=.env --import tsx src/index.ts" --name goready-api

  # Start frontend
  cd ../client
  pm2 start "npx next start" --name goready-web

  # Save PM2 config so it restarts on reboot
  pm2 save
  pm2 startup | tail -1 | bash 2>/dev/null || true

  cd ..
  pm2 status
REMOTE

echo ""
echo "========================================="
echo "  Deployed successfully!"
echo "  https://$DOMAIN"
echo "========================================="
