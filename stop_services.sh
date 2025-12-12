#!/bin/bash

echo "🛑 Stopping Bank Marketing Services..."

# Kill processes on ports
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ ML API stopped (port 8000)"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped (port 3000)"

echo "🎉 All services stopped!"
