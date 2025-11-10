#!/bin/bash

echo "🔄 Rebuilding and restarting Docker containers..."
echo ""

# Stop current containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Rebuild images with no cache to ensure all changes are included
echo "🏗️  Building fresh Docker images..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait a moment for services to start
sleep 5

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services running at:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:4000"
echo "   phpMyAdmin: http://localhost:8081"
echo ""
echo "📋 Container status:"
docker-compose ps

echo ""
echo "💡 To view logs: docker-compose logs -f"
