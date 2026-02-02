#!/bin/bash
set -e

echo "Starting automated setup..."

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/community-events
cd /opt/community-events

# Create docker-compose.yml
cat << 'EOF' | sudo tee docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: community-events-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: community_events
      MYSQL_USER: events_user
      MYSQL_PASSWORD: events_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    image: avishka2002/community-events-backend:latest
    container_name: community-events-backend
    restart: always
    ports:
      - "4000:4000"
    environment:
      DB_HOST: mysql
      DB_USER: events_user
      DB_PASSWORD: events_password
      DB_NAME: community_events
      PORT: 4000
    depends_on:
      mysql:
        condition: service_healthy

  frontend:
    image: avishka2002/community-events-frontend:latest
    container_name: community-events-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
EOF

# Pull latest images
sudo docker pull avishka2002/community-events-backend:latest
sudo docker pull avishka2002/community-events-frontend:latest

# Start containers
sudo docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 45

# Initialize database
echo "Initializing database..."
sudo docker exec community-events-backend node -e "
const db = require('./db');
db.initDB().then(() => {
  console.log('Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
" || echo "DB init will happen on first API call"

# Show status
echo "=== Container Status ==="
sudo docker ps

echo "=== Setup Complete ==="
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4000"
