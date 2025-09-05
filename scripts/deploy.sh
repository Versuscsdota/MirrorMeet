#!/usr/bin/env bash
set -euo pipefail

# MirrorCRM deploy helper for Ubuntu 24.04 (Nginx + PM2 + sslip.io)
# Usage: sudo bash scripts/deploy.sh 77.73.131.100

IP=${1:-}
if [[ -z "${IP}" ]]; then
  echo "Usage: $0 <SERVER_IP>"
  exit 1
fi
HOST="${IP//./-}.sslip.io"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl git ufw nginx software-properties-common

# Node.js 20 + PM2
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm i -g pm2

# Certbot (Nginx plugin)
apt-get install -y certbot python3-certbot-nginx

# Firewall (optional)
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
fi

systemctl enable nginx
systemctl start nginx

# Clone project if missing
mkdir -p /opt
if [[ ! -d /opt/mirrorcrm ]]; then
  git clone https://github.com/Versuscsdota/MirrorMeet.git /opt/mirrorcrm
fi
cd /opt/mirrorcrm

git pull || true

# Frontend
cd client
# Workaround npm optional deps bug with rollup: prefer npm i over ci
rm -rf node_modules package-lock.json
npm i
npm run build

# Backend
cd ../server
npm ci
npm run build

# ENV
cat >/opt/mirrorcrm/server/.env <<'EOF'
NODE_ENV=production
PORT=3001
DATA_DIR=/var/lib/mirrorcrm
UPLOADS_DIR=/var/lib/mirrorcrm/uploads
EXPORTS_DIR=/var/lib/mirrorcrm/exports
LOG_DIR=/var/log/mirrorcrm
EOF

# Create dirs
mkdir -p /var/lib/mirrorcrm/uploads /var/lib/mirrorcrm/exports /var/log/mirrorcrm
chmod 750 /var/lib/mirrorcrm /var/lib/mirrorcrm/uploads /var/lib/mirrorcrm/exports

# PM2
pm2 start /opt/mirrorcrm/server/dist/index.js --name mirrorcrm-api || pm2 restart mirrorcrm-api
pm2 save
pm2 startup systemd -u root --hp /root | sed -n 's/^\(.*systemctl.*pm2.*\)$/\1/p' | bash || true

# Nginx site
cat >/etc/nginx/sites-available/mirrorcrm <<EOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name ${HOST};
    root /opt/mirrorcrm/client/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        \$connection_upgrade;
    }

    # proxy /uploads and /exports to backend static
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        \$connection_upgrade;
    }

    location /exports/ {
        proxy_pass http://127.0.0.1:3001/exports/;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        \$connection_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mirrorcrm /etc/nginx/sites-enabled/mirrorcrm
rm -f /etc/nginx/sites-enabled/default || true
nginx -t
systemctl reload nginx

# Issue certificate
certbot --nginx -d "$HOST" --non-interactive --agree-tos -m admin@${HOST} || true

# Optional redirect 80->443 (certbot may add it automatically)
cat >/etc/nginx/sites-available/mirrorcrm-redirect <<EOF
server {
    listen 80;
    server_name ${HOST};
    return 301 https://\$host\$request_uri;
}
EOF
ln -sf /etc/nginx/sites-available/mirrorcrm-redirect /etc/nginx/sites-enabled/mirrorcrm-redirect
nginx -t
systemctl reload nginx

echo "Deploy complete: https://${HOST}"
