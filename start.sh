#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting GoReady...${NC}"

# ── Check prerequisites ──
check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}Error: $1 is not installed.${NC}"
    exit 1
  fi
}

check_command node
check_command npm
check_command psql

# ── Install dependencies if needed ──
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing root dependencies...${NC}"
  npm install
fi

if [ ! -d "server/node_modules" ]; then
  echo -e "${YELLOW}Installing server dependencies...${NC}"
  cd server && npm install && cd "$ROOT_DIR"
fi

if [ ! -d "client/node_modules" ]; then
  echo -e "${YELLOW}Installing client dependencies...${NC}"
  cd client && npm install && cd "$ROOT_DIR"
fi

if [ ! -d "shared/node_modules" ]; then
  echo -e "${YELLOW}Installing shared dependencies...${NC}"
  cd shared && npm install && cd "$ROOT_DIR"
fi

# ── Ensure PostgreSQL is running ──
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready &>/dev/null; then
  echo -e "${YELLOW}Starting PostgreSQL via Homebrew...${NC}"
  brew services start postgresql@18 2>/dev/null || brew services start postgresql 2>/dev/null || {
    echo -e "${RED}Error: Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
  }
  sleep 2
fi
echo -e "${GREEN}PostgreSQL is running!${NC}"

# ── Create database if it doesn't exist ──
DB_NAME="goready"
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "${YELLOW}Creating database '${DB_NAME}'...${NC}"
  createdb "$DB_NAME"
  echo -e "${GREEN}Database created!${NC}"
else
  echo -e "${GREEN}Database '${DB_NAME}' already exists.${NC}"
fi

# ── Set up .env with correct local connection ──
DB_USER="$(whoami)"
DB_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}"

if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=${DB_URL}|" server/.env
  echo -e "${YELLOW}Created server/.env${NC}"
fi

# ── Push database schema ──
echo -e "${GREEN}Pushing database schema...${NC}"
cd server && DATABASE_URL="$DB_URL" npx drizzle-kit push --force 2>&1 | tail -3
cd "$ROOT_DIR"

# ── Start both servers ──
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  GoReady is starting!${NC}"
echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}  Backend:  http://localhost:4000${NC}"
echo -e "${GREEN}  DB:       ${DB_URL}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ── Kill any leftover processes from previous runs ──
echo -e "${YELLOW}Cleaning up stale processes...${NC}"
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# ── Shutdown handler (kills entire process tree) ──
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  # Kill all child processes of this script
  pkill -P $SERVER_PID 2>/dev/null
  pkill -P $CLIENT_PID 2>/dev/null
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  # Also kill anything still on the ports
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
  wait $SERVER_PID $CLIENT_PID 2>/dev/null
  echo -e "${GREEN}Stopped.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend server in the background
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$ROOT_DIR/server" && npm run dev &
SERVER_PID=$!

# Start frontend (Next.js)
echo -e "${YELLOW}Starting frontend...${NC}"
cd "$ROOT_DIR" && npm run dev &
CLIENT_PID=$!

# Wait for both processes
wait
