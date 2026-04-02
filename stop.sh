#!/usr/bin/env bash

echo "Killing GoReady processes..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
pkill -f "tsx watch.*src/index.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
echo "Done."
