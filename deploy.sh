#!/bin/bash

# MirrorCRM Production Deployment Script
# Usage: ./deploy.sh [--skip-build]

set -e

echo "🚀 Starting MirrorCRM deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}
    exit 1
fi

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pnpm...${NC}"
    npm install -g pnpm
fi

# Check for --skip-build flag
SKIP_BUILD=false
if [[ "$1" == "--skip-build" ]]; then
    SKIP_BUILD=true
    echo -e "${YELLOW}⚠️  Skipping build step as requested${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p server/data server/uploads ssl
mkdir -p server/uploads
mkdir -p ssl

# Generate JWT secret if not exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}🔑 Generating JWT secret...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-super-secure-jwt-secret-key-change-this/$JWT_SECRET/g" .env.production
fi

# Set proper permissions
echo -e "${YELLOW}🔒 Setting permissions...${NC}"
mkdir -p server/data server/uploads
chmod -R 755 server/data server/uploads

# Install client dependencies
echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
cd client
pnpm install --frozen-lockfile
cd ..

# Build and start services
echo -e "${YELLOW}🏗️ Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ MirrorCRM deployed successfully!${NC}"
    echo -e "${GREEN}🌐 Frontend: http://77.73.131.100${NC}"
    echo -e "${GREEN}🔧 Backend API: http://77.73.131.100:3001${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Access the application at http://77.73.131.100"
    echo "2. Create your first admin user"
    echo "3. Configure your domain and SSL if needed"
else
    echo -e "${RED}❌ Deployment failed. Check logs with: docker-compose -f docker-compose.prod.yml logs${NC}"
    exit 1
fi
