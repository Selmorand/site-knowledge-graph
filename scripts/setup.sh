#!/bin/bash

set -e

echo "🚀 Setting up site-knowledge-graph..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo "✅ Docker version: $(docker --version)"

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker containers
echo "🐳 Starting Docker containers..."
npm run infra:up

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate --workspace=apps/api

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate --workspace=apps/api

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To view the database, run:"
echo "  npm run db:studio"
echo ""
