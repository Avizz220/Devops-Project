#!/bin/bash

# Deploy Community Events Platform to EC2
# This script deploys the latest Docker images from Docker Hub to a fresh EC2 instance

set -e

INSTANCE_IP=$1

if [ -z "$INSTANCE_IP" ]; then
    echo "Usage: ./quick-deploy.sh <instance-ip>"
    echo "Example: ./quick-deploy.sh 54.90.123.137"
    exit 1
fi

echo "🚀 Deploying to $INSTANCE_IP..."

# Copy docker-compose file
echo "📋 Copying docker-compose configuration..."
scp -o StrictHostKeyChecking=no deploy-docker-hub.yml ubuntu@$INSTANCE_IP:/tmp/docker-compose.yml

# Deploy via SSH
echo "🐳 Installing Docker and deploying containers..."
ssh -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'ENDSSH'
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker ubuntu
    fi

    # Create deployment directory
    sudo mkdir -p /opt/community-events
    sudo mv /tmp/docker-compose.yml /opt/community-events/
    cd /opt/community-events

    # Pull and start containers
    sudo docker-compose pull
    sudo docker-compose down || true
    sudo docker-compose up -d

    # Wait for services
    echo "⏳ Waiting for services to start..."
    sleep 30

    # Show status
    sudo docker-compose ps
    
    echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "🎉 Deployment finished!"
echo "🌐 Frontend: http://$INSTANCE_IP"
echo "🔧 Backend API: http://$INSTANCE_IP:4000"
echo "💚 Health Check: http://$INSTANCE_IP:4000/api/health"
echo ""
echo "⚠️  Note: You need to update src/config.js to:"
echo "   export const API_BASE_URL = 'http://$INSTANCE_IP:4000';"
