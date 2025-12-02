#!/bin/bash

echo "🚀 Starting AI Code Reviewer (Netlify Dev Mode)..."

# Check if .env file exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env file not found. Please create it with your configuration."
    exit 1
fi

# Load GEMINI_API_KEY from backend/.env and export it for Netlify Functions
if grep -q "GEMINI_API_KEY=" backend/.env; then
    export GEMINI_API_KEY=$(grep "GEMINI_API_KEY=" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "🔑 Loaded GEMINI_API_KEY for Netlify Functions"
else
    echo "⚠️  GEMINI_API_KEY not found in backend/.env"
fi

echo "🔧 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting frontend with Netlify Functions..."
cd frontend/my-app

# Check if netlify-cli is installed, if not use npx
if command -v netlify &> /dev/null; then
    netlify dev
else
    echo "📦 Netlify CLI not found, using npx..."
    npx -y netlify-cli dev
fi

# Cleanup on exit
trap "kill $BACKEND_PID; exit" INT
wait
