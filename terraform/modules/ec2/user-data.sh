#!/bin/bash
set -e

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Create project directory
mkdir -p /opt/community-events
cd /opt/community-events

# Create docker-compose.yml
cat <<EOF > docker-compose.yml
version: '3.8'

services:
  backend:
    image: ${dockerhub_username}/community-events-backend:${backend_image_tag}
    container_name: community_backend
    restart: unless-stopped
    environment:
      DB_HOST: ${db_host}
      DB_PORT: ${db_port}
      DB_USER: ${db_user}
      DB_PASSWORD: ${db_password}
      DB_NAME: ${db_name}
      PORT: ${backend_port}
      NODE_ENV: production
    ports:
      - "${backend_port}:${backend_port}"
    networks:
      - community-network

  frontend:
    image: ${dockerhub_username}/community-events-frontend:${frontend_image_tag}
    container_name: community_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    networks:
      - community-network

networks:
  community-network:
    driver: bridge
EOF

# Pull and start services
sudo docker-compose up -d