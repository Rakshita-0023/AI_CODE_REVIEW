#!/bin/bash

echo "🚀 Starting AI Code Review Platform..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo "📡 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd ../frontend/my-app && npm run dev &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "📊 Backend: http://localhost:5001"
echo "🎯 Frontend: http://localhost:5173"
echo "📋 Health Check: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait

