#!/bin/bash

echo "🚀 Starting Community Events Platform with Docker..."

# Build and start all services
docker-compose up --build -d

echo "✅ Services starting up..."
echo "📊 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:4000"
echo "🗄️  MySQL: localhost:3306"
echo ""
echo "🏥 Checking service health..."

# Wait for services to be healthy
echo "Waiting for MySQL..."
docker-compose exec mysql sh -c 'until mysqladmin ping -h localhost -u appuser -pStrongPasswordHere --silent; do sleep 1; done'

echo "Waiting for backend..."
until curl -s http://localhost:4000/api/health > /dev/null; do sleep 1; done

echo "Waiting for frontend..."
until curl -s http://localhost > /dev/null; do sleep 1; done

echo ""
echo "🎉 All services are up and running!"
echo "🌐 Open http://localhost in your browser to access the application"