#!/bin/bash

echo "🚀 Starting AI Code Reviewer (Local Development)..."

# Check if .env file exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env file not found. Please create it with your configuration."
    exit 1
fi

# Check if Gemini API key is set
if ! grep -q "GEMINI_API_KEY=" backend/.env; then
    echo "⚠️  No Gemini API key found in backend/.env file."
    echo "📝 Please add your GEMINI_API_KEY to backend/.env file."
    exit 1
fi

echo "🔧 Starting backend server..."
cd backend && PORT=5001 npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting frontend development server..."
cd ../frontend/my-app && npm run dev &
FRONTEND_PID=$!

echo "✅ Services started successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3456"
echo "   Backend:  http://localhost:5001"
echo "   Health:   http://localhost:5001/health"
echo ""
echo "🛑 To stop both servers, press Ctrl+C"

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
