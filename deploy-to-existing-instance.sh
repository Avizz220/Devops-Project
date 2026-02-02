#!/bin/bash

##############################################################################
# DEPLOY TO EXISTING AWS INSTANCE
# This script deploys the application to the existing EC2 instance
##############################################################################

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTANCE_ID="i-064119cb154739571"
AWS_REGION="us-east-1"
KEY_PATH="./community-events-key-prod.pem"

# Functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_header() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${GREEN}$1${NC}\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

print_header "🚀 DEPLOYING TO AWS EC2 INSTANCE"

# Step 1: Get instance details
print_header "Step 1: Getting Instance Details"
INSTANCE_INFO=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress,PrivateIpAddress]' \
    --output text)

STATE=$(echo $INSTANCE_INFO | awk '{print $1}')
PUBLIC_IP=$(echo $INSTANCE_INFO | awk '{print $2}')
PRIVATE_IP=$(echo $INSTANCE_INFO | awk '{print $3}')

print_info "Instance ID: $INSTANCE_ID"
print_info "State: $STATE"
print_info "Public IP: $PUBLIC_IP"
print_info "Private IP: $PRIVATE_IP"

if [ "$STATE" != "running" ]; then
    print_error "Instance is not running! State: $STATE"
    exit 1
fi
print_success "Instance is running"

# Step 2: Check SSH key
print_header "Step 2: Checking SSH Key"
if [ ! -f "$KEY_PATH" ]; then
    print_error "SSH key not found at $KEY_PATH"
    print_info "Please download your key from AWS and place it in the project root"
    exit 1
fi

chmod 400 "$KEY_PATH"
print_success "SSH key found and permissions set"

# Step 3: Create Docker Compose file
print_header "Step 3: Creating Docker Compose Configuration"
cat > /tmp/docker-compose-prod.yml << 'EOF'
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
      DB_USER: root
      DB_PASSWORD: root123
      DB_NAME: community_events
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - community-network

  frontend:
    image: avishka2002/community-events-frontend:latest
    container_name: community_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - community-network

volumes:
  mysql_data:

networks:
  community-network:
    driver: bridge
EOF
print_success "Docker Compose file created"

# Step 4: Copy files to server
print_header "Step 4: Copying Files to Server"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    /tmp/docker-compose-prod.yml \
    ubuntu@$PUBLIC_IP:/tmp/docker-compose.yml
print_success "Files copied to server"

# Step 5: Install Docker and Docker Compose on server
print_header "Step 5: Setting Up Docker on Server"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP << 'ENDSSH'
# Update system
sudo apt-get update -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker ubuntu
    echo "Docker installed successfully"
else
    echo "Docker is already installed"
fi

# Verify Docker installation
docker --version
docker compose version
ENDSSH
print_success "Docker setup complete"

# Step 6: Deploy application
print_header "Step 6: Deploying Application"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP << 'ENDSSH'
# Stop existing containers
echo "Stopping existing containers..."
docker compose -f /tmp/docker-compose.yml down 2>/dev/null || true

# Pull latest images
echo "Pulling latest Docker images..."
docker pull avishka2002/community-events-backend:latest
docker pull avishka2002/community-events-frontend:latest
docker pull mysql:8.0

# Start containers
echo "Starting containers..."
docker compose -f /tmp/docker-compose.yml up -d

# Wait for containers to be healthy
echo "Waiting for containers to be healthy..."
sleep 30

# Check container status
echo "Container status:"
docker ps

# Check logs
echo ""
echo "Backend logs:"
docker logs community_backend --tail 20

echo ""
echo "Frontend logs:"
docker logs community_frontend --tail 20
ENDSSH
print_success "Application deployed"

# Step 7: Configure security group
print_header "Step 7: Configuring Security Group"
SECURITY_GROUP=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text)

print_info "Security Group: $SECURITY_GROUP"

# Add rules if they don't exist
aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 2>/dev/null || print_warning "Port 80 rule already exists"

aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 4000 \
    --cidr 0.0.0.0/0 2>/dev/null || print_warning "Port 4000 rule already exists"

aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 2>/dev/null || print_warning "Port 22 rule already exists"

print_success "Security group configured"

# Step 8: Verify deployment
print_header "Step 8: Verifying Deployment"
print_info "Testing endpoints..."

sleep 10

# Test frontend
if curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP | grep -q "200\|301\|302"; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend may not be ready yet. Check manually: http://$PUBLIC_IP"
fi

# Test backend
if curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:4000/health | grep -q "200"; then
    print_success "Backend is accessible"
else
    print_warning "Backend may not be ready yet. Check manually: http://$PUBLIC_IP:4000/health"
fi

# Final summary
print_header "🎉 DEPLOYMENT COMPLETE!"
echo ""
print_success "Application URLs:"
echo -e "${GREEN}Frontend:${NC} http://$PUBLIC_IP"
echo -e "${GREEN}Backend:${NC}  http://$PUBLIC_IP:4000"
echo ""
print_info "SSH Access:"
echo -e "ssh -i $KEY_PATH ubuntu@$PUBLIC_IP"
echo ""
print_info "Useful Docker Commands (run on server):"
echo -e "  ${BLUE}docker ps${NC}                              - List containers"
echo -e "  ${BLUE}docker logs community_backend${NC}          - Backend logs"
echo -e "  ${BLUE}docker logs community_frontend${NC}         - Frontend logs"
echo -e "  ${BLUE}docker logs community_mysql${NC}            - Database logs"
echo -e "  ${BLUE}docker compose -f /tmp/docker-compose.yml restart${NC} - Restart all"
echo ""
print_warning "Note: If the application is not accessible, wait 1-2 minutes for initialization"
echo ""
