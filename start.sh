#!/bin/bash

echo "🚀 Starting AI Code Reviewer Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your AI API keys before running again."
    echo "   Required: OPENAI_API_KEY or ANTHROPIC_API_KEY"
    exit 1
fi

# Check if AI API key is set
if ! grep -q "OPENAI_API_KEY=sk-" .env && ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
    echo "⚠️  No AI API key found in .env file."
    echo "📝 Please add your OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file."
    exit 1
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5001"
    echo "   Health:   http://localhost:5001/health"
    echo ""
    echo "📊 To view logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 To stop:"
    echo "   docker-compose down"
else
    echo "❌ Failed to start services. Check logs:"
    docker-compose logs
fi