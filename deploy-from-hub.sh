#!/bin/bash

# Deploy script using Docker Hub images
# Usage: ./deploy-from-hub.sh [your-dockerhub-username] [image-tag]

DOCKERHUB_USERNAME=${1:-yourusername}
IMAGE_TAG=${2:-latest}

echo "=================================================="
echo "Deploying Community Events Platform from Docker Hub"
echo "=================================================="
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Image Tag: $IMAGE_TAG"
echo "=================================================="

# Pull latest images
echo "📥 Pulling latest images from Docker Hub..."
docker pull $DOCKERHUB_USERNAME/community-events-frontend:$IMAGE_TAG
docker pull $DOCKERHUB_USERNAME/community-events-backend:$IMAGE_TAG

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.hub.yml down

# Start services with Docker Hub images
echo "🚀 Starting services..."
DOCKERHUB_USERNAME=$DOCKERHUB_USERNAME IMAGE_TAG=$IMAGE_TAG docker-compose -f docker-compose.hub.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check status
echo "📊 Checking service status..."
docker-compose -f docker-compose.hub.yml ps

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:4000"
echo "phpMyAdmin: http://localhost:8081"
echo "=================================================="
