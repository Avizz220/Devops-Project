#!/bin/bash

##############################################################################
# SIMPLE DEPLOYMENT USING AWS SSM - NO SSH KEY NEEDED
##############################################################################

set -e

# Configuration
INSTANCE_ID="i-064119cb154739571"
AWS_REGION="us-east-1"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 DEPLOYING APPLICATION TO AWS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get instance IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${BLUE}ℹ${NC} Instance: $INSTANCE_ID"
echo -e "${BLUE}ℹ${NC} Public IP: $PUBLIC_IP"
echo ""

# Create parameters JSON file
cat > /tmp/ssm-params.json << 'EOF'
{
  "commands": [
    "#!/bin/bash",
    "echo '=== Installing Docker ==='",
    "sudo apt-get update -y",
    "if ! command -v docker &> /dev/null; then",
    "  curl -fsSL https://get.docker.com -o get-docker.sh",
    "  sudo sh get-docker.sh",
    "  sudo usermod -aG docker ubuntu",
    "fi",
    "sudo systemctl start docker",
    "sudo systemctl enable docker",
    "echo '=== Docker installed ==='",
    "echo ''",
    "echo '=== Creating Docker Compose file ==='",
    "cat > /tmp/docker-compose.yml << 'DOCKEREOF'",
    "version: '3.8'",
    "services:",
    "  mysql:",
    "    image: mysql:8.0",
    "    container_name: community_mysql",
    "    restart: unless-stopped",
    "    environment:",
    "      MYSQL_ROOT_PASSWORD: root123",
    "      MYSQL_DATABASE: community_events",
    "    ports:",
    "      - '3306:3306'",
    "    volumes:",
    "      - mysql_data:/var/lib/mysql",
    "    networks:",
    "      - community-network",
    "    healthcheck:",
    "      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-proot123']",
    "      timeout: 20s",
    "      retries: 10",
    "  backend:",
    "    image: avishka2002/community-events-backend:latest",
    "    container_name: community_backend",
    "    restart: unless-stopped",
    "    environment:",
    "      DB_HOST: mysql",
    "      DB_PORT: 3306",
    "      DB_USER: root",
    "      DB_PASSWORD: root123",
    "      DB_NAME: community_events",
    "      PORT: 4000",
    "    ports:",
    "      - '4000:4000'",
    "    depends_on:",
    "      mysql:",
    "        condition: service_healthy",
    "    networks:",
    "      - community-network",
    "  frontend:",
    "    image: avishka2002/community-events-frontend:latest",
    "    container_name: community_frontend",
    "    restart: unless-stopped",
    "    ports:",
    "      - '80:80'",
    "    depends_on:",
    "      - backend",
    "    networks:",
    "      - community-network",
    "volumes:",
    "  mysql_data:",
    "networks:",
    "  community-network:",
    "    driver: bridge",
    "DOCKEREOF",
    "echo '=== Stopping old containers ==='",
    "sudo docker compose -f /tmp/docker-compose.yml down 2>/dev/null || true",
    "echo '=== Pulling images ==='",
    "sudo docker pull avishka2002/community-events-backend:latest",
    "sudo docker pull avishka2002/community-events-frontend:latest",
    "sudo docker pull mysql:8.0",
    "echo '=== Starting containers ==='",
    "sudo docker compose -f /tmp/docker-compose.yml up -d",
    "sleep 30",
    "echo ''",
    "echo '=== Container Status ==='",
    "sudo docker ps",
    "echo ''",
    "echo '=== Backend Logs ==='",
    "sudo docker logs community_backend --tail 15 2>&1 || echo 'Backend not ready yet'",
    "echo ''",
    "echo '=== Deployment Complete ==='"
  ]
}
EOF

echo -e "${BLUE}ℹ${NC} Sending deployment commands to instance..."

# Send command
COMMAND_ID=$(aws ssm send-command \
    --region $AWS_REGION \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters file:///tmp/ssm-params.json \
    --query 'Command.CommandId' \
    --output text)

echo -e "${BLUE}ℹ${NC} Command ID: $COMMAND_ID"
echo -e "${YELLOW}⏳${NC} Waiting for deployment to complete (2-3 minutes)..."
echo ""

# Wait for command
sleep 10
for i in {1..30}; do
    STATUS=$(aws ssm get-command-invocation \
        --region $AWS_REGION \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'Status' \
        --output text 2>/dev/null || echo "Pending")
    
    if [ "$STATUS" == "Success" ] || [ "$STATUS" == "Failed" ]; then
        break
    fi
    echo -n "."
    sleep 5
done
echo ""

# Show results
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}DEPLOYMENT OUTPUT:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

aws ssm get-command-invocation \
    --region $AWS_REGION \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text

if [ "$STATUS" != "Success" ]; then
    echo ""
    echo -e "${RED}Errors:${NC}"
    aws ssm get-command-invocation \
        --region $AWS_REGION \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'StandardErrorContent' \
        --output text
fi

# Configure security group
echo ""
echo -e "${BLUE}ℹ${NC} Configuring security group..."

SECURITY_GROUP=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 2>/dev/null && echo -e "${GREEN}✓${NC} Opened port 80" || echo -e "${YELLOW}⚠${NC} Port 80 already open"

aws ec2 authorize-security-group-ingress \
    --region $AWS_REGION \
    --group-id $SECURITY_GROUP \
    --protocol tcp \
    --port 4000 \
    --cidr 0.0.0.0/0 2>/dev/null && echo -e "${GREEN}✓${NC} Opened port 4000" || echo -e "${YELLOW}⚠${NC} Port 4000 already open"

# Test deployment
echo ""
echo -e "${BLUE}ℹ${NC} Verifying deployment..."
sleep 15

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ]; then
    echo -e "${GREEN}✓${NC} Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}⚠${NC} Frontend returned HTTP $HTTP_CODE (may need more time)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:4000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC} Backend is accessible (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}⚠${NC} Backend returned HTTP $HTTP_CODE (may need more time)"
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Application URLs:${NC}"
echo -e "  Frontend: http://$PUBLIC_IP"
echo -e "  Backend:  http://$PUBLIC_IP:4000"
echo ""
echo -e "${BLUE}ℹ${NC} To check status: ./check-deployment.sh"
echo -e "${BLUE}ℹ${NC} To connect to instance: aws ssm start-session --region $AWS_REGION --target $INSTANCE_ID"
echo ""
