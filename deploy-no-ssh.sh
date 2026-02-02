#!/bin/bash

##############################################################################
# DEPLOY WITHOUT SSH KEY - Using AWS Systems Manager Session Manager
# This script deploys the application using SSM (no SSH key required)
##############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTANCE_ID="i-064119cb154739571"
AWS_REGION="us-east-1"

# Functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_header() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${GREEN}$1${NC}\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

print_header "🚀 DEPLOYING VIA AWS SYSTEMS MANAGER (No SSH Key Needed)"

# Step 1: Get instance details
print_header "Step 1: Getting Instance Details"
INSTANCE_INFO=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]' \
    --output text)

STATE=$(echo $INSTANCE_INFO | awk '{print $1}')
PUBLIC_IP=$(echo $INSTANCE_INFO | awk '{print $2}')

print_info "Instance ID: $INSTANCE_ID"
print_info "State: $STATE"
print_info "Public IP: $PUBLIC_IP"

if [ "$STATE" != "running" ]; then
    print_error "Instance is not running! State: $STATE"
    exit 1
fi
print_success "Instance is running"

# Step 2: Create deployment script
print_header "Step 2: Creating Deployment Script"
cat > /tmp/deploy-commands.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "=== Starting Deployment ==="

# Update system
echo "Updating system packages..."
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

# Create docker-compose file
echo "Creating Docker Compose configuration..."
cat > /tmp/docker-compose.yml << 'EOF'
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

# Stop existing containers
echo "Stopping existing containers..."
sudo docker compose -f /tmp/docker-compose.yml down 2>/dev/null || true

# Pull latest images
echo "Pulling latest Docker images..."
sudo docker pull avishka2002/community-events-backend:latest
sudo docker pull avishka2002/community-events-frontend:latest
sudo docker pull mysql:8.0

# Start containers
echo "Starting containers..."
sudo docker compose -f /tmp/docker-compose.yml up -d

# Wait for containers
echo "Waiting for containers to be healthy..."
sleep 30

# Show container status
echo "Container status:"
sudo docker ps

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Backend logs:"
sudo docker logs community_backend --tail 20 2>&1 || true

echo ""
echo "Frontend logs:"
sudo docker logs community_frontend --tail 20 2>&1 || true

DEPLOY_SCRIPT

print_success "Deployment script created"

# Step 3: Run deployment via SSM
print_header "Step 3: Running Deployment Commands"
print_info "Sending commands to instance via AWS Systems Manager..."

COMMAND_ID=$(aws ssm send-command \
    --region $AWS_REGION \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["bash /tmp/deploy-commands.sh"]' \
    --query 'Command.CommandId' \
    --output text)

print_info "Command ID: $COMMAND_ID"
print_info "Uploading deployment script to instance..."

# Upload the deployment script
aws s3 cp /tmp/deploy-commands.sh s3://temp-deployment-script.sh 2>/dev/null || {
    # If S3 fails, use document content directly
    COMMAND_ID=$(aws ssm send-command \
        --region $AWS_REGION \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters file:///tmp/ssm-params.json \
        --query 'Command.CommandId' \
        --output text)
}
print_info "Waiting for command to complete (this may take 2-3 minutes)..."

# Wait for command to complete
sleep 10
STATUS="InProgress"
while [ "$STATUS" == "InProgress" ] || [ "$STATUS" == "Pending" ]; do
    sleep 10
    STATUS=$(aws ssm get-command-invocation \
        --region $AWS_REGION \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'Status' \
        --output text 2>/dev/null || echo "Pending")
    echo -n "."
done
echo ""

# Get command output
if [ "$STATUS" == "Success" ]; then
    print_success "Deployment completed successfully!"
    
    print_header "Command Output:"
    aws ssm get-command-invocation \
        --region $AWS_REGION \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'StandardOutputContent' \
        --output text
else
    print_error "Deployment failed! Status: $STATUS"
    
    print_header "Error Output:"
    aws ssm get-command-invocation \
        --region $AWS_REGION \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'StandardErrorContent' \
        --output text
    exit 1
fi

# Step 4: Configure security group
print_header "Step 4: Configuring Security Group"
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
    --cidr 0.0.0.0/0 2>/dev/null && print_success "Opened port 80" || print_warning "Port 80 already open"

aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 4000 \
    --cidr 0.0.0.0/0 2>/dev/null && print_success "Opened port 4000" || print_warning "Port 4000 already open"

print_success "Security group configured"

# Step 5: Verify deployment
print_header "Step 5: Verifying Deployment"
sleep 15

# Test endpoints
print_info "Testing endpoints..."

# Test frontend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    print_success "Frontend is accessible (HTTP $HTTP_CODE)"
else
    print_warning "Frontend returned HTTP $HTTP_CODE - may need more time to start"
fi

# Test backend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:4000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    print_success "Backend is accessible (HTTP $HTTP_CODE)"
else
    print_warning "Backend returned HTTP $HTTP_CODE - may need more time to start"
fi

# Final summary
print_header "🎉 DEPLOYMENT COMPLETE!"
echo ""
print_success "Application URLs:"
echo -e "  ${GREEN}Frontend:${NC} http://$PUBLIC_IP"
echo -e "  ${GREEN}Backend:${NC}  http://$PUBLIC_IP:4000"
echo ""
print_info "To check logs on the server, run:"
echo -e "  ${BLUE}aws ssm start-session --region $AWS_REGION --target $INSTANCE_ID${NC}"
echo -e "  Then: ${BLUE}sudo docker logs community_backend${NC}"
echo ""
print_warning "If services are not accessible yet, wait 1-2 minutes for full initialization"
echo ""
print_info "To check status again, run: ${BLUE}./check-deployment.sh${NC}"
echo ""
