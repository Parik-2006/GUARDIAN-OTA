#!/usr/bin/env bash

set -e

echo "🚀 Starting GUARDIAN-OTA Full Stack..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}⏹️  Stopping services...${NC}"
    pkill -f "go run" || true
    pkill -f "next dev" || true
    docker compose -f deploy/docker-compose.yml down || true
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Step 1: Start Infrastructure
echo -e "${YELLOW}[1/4]${NC} Starting Docker infrastructure..."
cd "$(dirname "$0")/deploy"
docker compose up -d
cd - > /dev/null
sleep 3
echo -e "${GREEN}✓${NC} Infrastructure started"
echo ""

# Step 2: Backend dependencies
echo -e "${YELLOW}[2/4]${NC} Installing backend dependencies..."
cd "$(dirname "$0")/backend"
go mod download
cd - > /dev/null
echo -e "${GREEN}✓${NC} Backend dependencies ready"
echo ""

# Step 3: Frontend dependencies
echo -e "${YELLOW}[3/4]${NC} Installing frontend dependencies..."
cd "$(dirname "$0")/dashboard"
npm install > /dev/null 2>&1
cd - > /dev/null
echo -e "${GREEN}✓${NC} Frontend dependencies ready"
echo ""

# Step 4: Start services
echo -e "${YELLOW}[4/4]${NC} Starting services..."
echo ""

# Start backend in background
cd "$(dirname "$0")/backend"
go run . &
BACKEND_PID=$!
cd - > /dev/null
echo -e "${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"

# Give backend time to start
sleep 2

# Start frontend in foreground
cd "$(dirname "$0")/dashboard"
echo -e "${GREEN}✓${NC} Frontend starting..."
echo ""
npm run dev
