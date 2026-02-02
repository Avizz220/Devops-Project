#!/bin/bash
# User Data Script - Runs on EC2 instance startup

set -e

# Update system
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Create application directory
sudo mkdir -p /opt/community-events
cd /opt/community-events

# Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: community_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: community_events
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - community-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-proot123"]
      timeout: 20s
      retries: 10

  backend:
    image: avishka2002/community-events-backend:latest
    container_name: community_backend
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${db_user}
    pull_policy: always
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: root123
      DB_NAME: community_events
      PORT: 4000
      NODE_ENV: production
    ports:
      - "4000:4000"
    volumes:
      - backend_uploads:/app/uploads
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - community-network

  frontend:
    image: avishka2002/community-events-frontend:latest
    container_name: community_frontend
    restart: unless-stopped
    pull_policy: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - community-network

volumes:
  backend_uploads:
  mysql_data:

networks:
  community-network:
    driver: bridge
EOF

# Pull images and start containers
sudo docker-compose pull
sudo docker-compose up -d

# Wait for services
sleep 45

echo "✅ Application setup complete!"
