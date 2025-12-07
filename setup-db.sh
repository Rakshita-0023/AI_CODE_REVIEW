#!/bin/bash

echo "🗄️  Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install postgresql
        brew services start postgresql
    else
        echo "❌ Homebrew not found. Please install PostgreSQL manually:"
        echo "   https://www.postgresql.org/download/"
        exit 1
    fi
fi

# Create database and user
echo "📝 Creating database and user..."
psql postgres -c "CREATE DATABASE ai_code_review;" 2>/dev/null || echo "Database may already exist"
psql postgres -c "CREATE USER username WITH PASSWORD 'password';" 2>/dev/null || echo "User may already exist"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_code_review TO username;" 2>/dev/null

echo "✅ Database setup complete!"
echo "📋 Connection details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: ai_code_review"
echo "   Username: username"
echo "   Password: password"

