#!/bin/bash

echo "🧪 Testing AI Code Review Platform Setup..."

# Test backend health
echo "📡 Testing backend health..."
cd backend && node server-new.js &
BACKEND_PID=$!
sleep 3

HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
if [[ $HEALTH_RESPONSE == *"OK"* ]]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# Test API endpoints
echo "📋 Testing API endpoints..."
curl -s http://localhost:5001/api/auth/register > /dev/null && echo "✅ Auth routes accessible" || echo "❌ Auth routes failed"

# Stop backend
kill $BACKEND_PID 2>/dev/null

# Test frontend dependencies
echo "🎨 Testing frontend setup..."
cd ../frontend/my-app
if npm list @react-oauth/google > /dev/null 2>&1; then
    echo "✅ Google OAuth dependency installed"
else
    echo "❌ Google OAuth dependency missing"
fi

echo "🎯 Setup verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env files with your API keys"
echo "2. Run: ./start-new.sh to start both servers"
echo "3. Visit: http://localhost:3456 for frontend"
echo "4. Visit: http://localhost:5001/health for backend"
