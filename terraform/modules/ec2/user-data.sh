#!/bin/bash
# User Data Script - Runs on EC2 instance startup

set -e

# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker
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
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ${project_name}_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${db_password}
      MYSQL_DATABASE: ${db_name}
      MYSQL_USER: ${db_user}
      MYSQL_PASSWORD: ${db_password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${db_password}"]
      timeout: 10s
      retries: 5
      start_period: 30s

  backend:
    image: ${dockerhub_username}/community-events-backend:${backend_image_tag}
    container_name: ${project_name}_backend
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
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
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:${backend_port}/api/health"]
      timeout: 10s
      retries: 5
      start_period: 40s

  frontend:
    image: ${dockerhub_username}/community-events-frontend:${frontend_image_tag}
    container_name: ${project_name}_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      timeout: 10s
      retries: 3

volumes:
  backend_uploads:
    driver: local
  mysql_data:
    driver: local
EOF

# Pull images and start containers
sudo docker-compose pull
sudo docker-compose up -d

# Enable automatic restart on reboot
cat > /etc/systemd/system/community-events.service <<'SERVICE_EOF'
[Unit]
Description=Community Events Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/community-events
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo systemctl daemon-reload
sudo systemctl enable community-events.service

echo "✅ Application setup complete!"
