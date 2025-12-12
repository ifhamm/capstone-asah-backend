#!/bin/bash


echo "🚀 Starting Bank Marketing Services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if in correct directory
if [ ! -d "ml-api" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Run this script from the capstone_asah root directory${NC}"
    echo "   Expected: ml-api/ and backend/ folders"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port in use
    else
        return 1  # Port free
    fi
}

# Kill existing processes on ports
echo "📍 Checking ports..."
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 in use, killing process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 in use, killing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Start ML API
echo "🐍 Starting ML API (FastAPI) on port 8000..."
cd ml-api
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../ml-api.log 2>&1 &
ML_PID=$!
cd ..
echo -e "${GREEN}✅ ML API started (PID: $ML_PID)${NC}"
echo ""

# Wait for ML API to be ready
echo "⏳ Waiting for ML API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ML API is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ ML API failed to start. Check ml-api.log${NC}"
        exit 1
    fi
done
echo ""

# Start Backend
echo "📦 Starting Backend (Express) on port 3000..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install -q
fi
nohup node app.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready..."
sleep 2
for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
done
echo ""

# Test health
echo "🧪 Testing integration..."
echo ""
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "Health Check Response:"
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 All Services Running!${NC}"
echo "======================================"
echo ""
echo "📍 Endpoints:"
echo "   ML API:  http://localhost:8000"
echo "   Backend: http://localhost:3000"
echo ""
echo "🧪 Test Commands:"
echo "   curl http://localhost:8000/health"
echo "   curl http://localhost:3000/api/health"
echo "   curl -X POST http://localhost:3000/api/predict -H 'Content-Type: application/json' -d @test_request.json"
echo ""
echo "📄 Logs:"
echo "   ML API:  tail -f ml-api.log"
echo "   Backend: tail -f backend.log"
echo ""
echo "🛑 Stop Services:"
echo "   kill $ML_PID $BACKEND_PID"
echo "   Or run: ./stop_services.sh"
echo ""
