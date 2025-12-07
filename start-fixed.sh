#!/bin/bash

echo "🚀 Starting AI Code Review Platform (Fixed Version)..."

# Kill any existing processes
pkill -f "server-new.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start backend
echo "📡 Starting backend server..."
cd backend && node server-new.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend/my-app && npm run dev -- --port 5174 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Servers started successfully!"
echo "📊 Backend: http://localhost:5001"
echo "🎯 Frontend: http://localhost:5174"
echo "📋 Health Check: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "server-new.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for processes
wait