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
  mysql:
    image: mysql:8.0
    container_name: community_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${db_password}
      MYSQL_DATABASE: ${db_name}
      MYSQL_USER: ${db_user}
      MYSQL_PASSWORD: ${db_password}
    ports:
      - "3306:3306"
    networks:
      - community-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "${db_user}", "-p${db_password}"]
      timeout: 20s
      retries: 10
      
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
    volumes:
      - backend_uploads:/app/uploads
    depends_on:
      mysql:
        condition: service_healthy
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

volumes:
  backend_uploads:
    driver: local
EOF

# Pull and start services
sudo docker-compose up -d