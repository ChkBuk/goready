#!/usr/bin/env bash
# ============================================================
# GoReady — Server Deploy Script
# Run this ON THE SERVER to pull and deploy latest code
# Usage: ~/app/deploy.sh
# ============================================================
set -e

APP_DIR="$HOME/app"
cd "$APP_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying GoReady...${NC}"

# ── 1. Pull latest code (force-reset local changes, keep env/uploads) ──
echo -e "${YELLOW}[1/5] Pulling latest code...${NC}"
git reset --hard HEAD
git clean -fd -e server/.env -e .env.local -e server/uploads -e next.config.ts
git pull origin main

# ── 2. Install dependencies ──
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
cd server && npm install && cd "$APP_DIR"

# ── 3. Ensure next.config.ts has ignoreBuildErrors ──
echo -e "${YELLOW}[3/5] Configuring build...${NC}"
cat > "$APP_DIR/next.config.ts" << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
EOF

# ── 4. Build frontend ──
echo -e "${YELLOW}[4/5] Building frontend...${NC}"
npx next build

# ── 5. Restart services ──
echo -e "${YELLOW}[5/5] Restarting services...${NC}"
pm2 delete all 2>/dev/null || true
pm2 start "npx tsx src/index.ts" --name goready-api --cwd "$APP_DIR/server"
pm2 start "npx next start" --name goready-web --cwd "$APP_DIR"
pm2 save

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
