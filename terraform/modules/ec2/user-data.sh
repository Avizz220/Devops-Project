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
  backend:
    image: ${dockerhub_username}/community-events-backend:${backend_image_tag}
    container_name: ${project_name}_backend
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
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:${backend_port}/api/health"]
      timeout: 10s
      retries: 5
      start_period: 30s

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
