#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  IPL 2026 Auction Simulator – Quick Start
# ─────────────────────────────────────────────
set -e

echo "🏏 IPL 2026 Auction Simulator"
echo "================================"

# ── Install deps ─────────────────────────────
echo "📦 Installing server dependencies…"
cd server && npm install && cd ..

echo "📦 Installing client dependencies…"
cd client && npm install && cd ..

# ── Copy env files ────────────────────────────
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "📄 Created server/.env from example"
fi

if [ ! -f client/.env ]; then
  cp client/.env.example client/.env
  echo "📄 Created client/.env from example"
fi

# ── Seed DB (optional, skips if MongoDB not running) ─
echo "🌱 Attempting to seed database (requires MongoDB)…"
cd server && npm run seed 2>/dev/null && cd .. || echo "⚠️  Seed skipped (MongoDB not running – server will still work)"

# ── Launch both servers ───────────────────────
echo ""
echo "🚀 Starting servers…"
echo "   Server:  http://localhost:5000"
echo "   Client:  http://localhost:5173"
echo ""

# Run both concurrently
npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "cyan,magenta" \
  "cd server && npm run dev" \
  "cd client && npm run dev"
