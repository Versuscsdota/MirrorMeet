#!/usr/bin/env bash
set -euo pipefail

# MirrorCRM update helper
# Usage: sudo bash scripts/update.sh

cd /opt/mirrorcrm

echo "Pulling latest changes..."
git pull

echo "Rebuilding frontend..."
cd client
# Workaround npm optional deps bug: prefer npm i over ci
rm -rf node_modules package-lock.json
npm i
npm run build

echo "Rebuilding backend..."
cd ../server
npm ci
npm run build

pm2 restart mirrorcrm-api
pm2 save

# Reload nginx to pick up any config or static updates
nginx -t && systemctl reload nginx

echo "Update complete."
