#!/bin/bash

# Knowledge Graph RAG Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Knowledge Graph RAG Setup Script"
echo "====================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"

# Check if Node.js version is 18+
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version is compatible"

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pnpm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
pnpm install
cd ..

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend environment file..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:4433/api
VITE_WS_URL=http://localhost:4433
EOF
    echo "✅ Frontend environment file created"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend/dist

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Docker is available"
    echo "   You can use 'docker-compose up -d' to start the services"
else
    echo "⚠️  Docker is not available"
    echo "   Please install Docker to use the containerized setup"
fi

# Check if MongoDB is available
if command -v mongod &> /dev/null; then
    echo "🍃 MongoDB is available"
else
    echo "⚠️  MongoDB is not available"
    echo "   Please install MongoDB or use Docker"
fi

# Check if QdrantDB is available
if command -v qdrant &> /dev/null; then
    echo "🔍 QdrantDB is available"
else
    echo "⚠️  QdrantDB is not available"
    echo "   Please install QdrantDB or use Docker"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your configuration"
echo "2. Start the services:"
echo "   - Using Docker: docker-compose up -d"
echo "   - Manually: pnpm run dev"
echo ""
echo "Access the application:"
echo "- Frontend: http://localhost:5173"
echo "- Backend: http://localhost:4433"
echo "- Health Check: http://localhost:4433/health"
echo ""
echo "For more information, see README.md and DEPLOYMENT.md"