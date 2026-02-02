#!/bin/bash

##############################################################################
# UPDATE FRONTEND ON INSTANCE
# This script updates the frontend container with the new build
##############################################################################

set -e

# Configuration
INSTANCE_IP="13.220.61.29"
REGION="us-east-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 UPDATING FRONTEND ON AWS INSTANCE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Instance IP: $INSTANCE_IP"
echo ""

# Create update script
cat > /tmp/update-frontend.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Pulling latest frontend image ==="
sudo docker pull avishka2002/community-events-frontend:latest

echo ""
echo "=== Stopping frontend container ==="
sudo docker stop community_frontend || true
sudo docker rm community_frontend || true

echo ""
echo "=== Starting updated frontend ==="
sudo docker run -d \
  --name community_frontend \
  --restart unless-stopped \
  -p 80:80 \
  --network community-network \
  avishka2002/community-events-frontend:latest

echo ""
echo "=== Waiting for container to be ready ==="
sleep 10

echo ""
echo "=== Container status ==="
sudo docker ps | grep community_frontend

echo ""
echo "=== Testing frontend ==="
curl -s http://localhost/ | head -10

echo ""
echo "✅ Frontend updated successfully!"
EOF

chmod +x /tmp/update-frontend.sh

echo "ℹ Uploading update script..."
scp -i community-events-key-prod.pem -o StrictHostKeyChecking=no \
    /tmp/update-frontend.sh ubuntu@$INSTANCE_IP:/tmp/ 2>/dev/null || {
    echo "❌ SSH key not found. Trying alternative method..."
    
    # Create SSM command
    INSTANCE_ID=$(aws ec2 describe-instances --region $REGION \
        --filters "Name=ip-address,Values=$INSTANCE_IP" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text)
    
    if [ "$INSTANCE_ID" != "None" ] && [ -n "$INSTANCE_ID" ]; then
        echo "ℹ Using AWS Systems Manager..."
        
        aws ssm send-command \
            --region $REGION \
            --instance-ids "$INSTANCE_ID" \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=[
                "sudo docker pull avishka2002/community-events-frontend:latest",
                "sudo docker stop community_frontend || true",
                "sudo docker rm community_frontend || true",
                "sudo docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest",
                "sleep 10",
                "sudo docker ps | grep community_frontend"
            ]' \
            --output text
        
        echo "✅ Update command sent via SSM"
        echo "ℹ Wait 30 seconds for update to complete"
        exit 0
    else
        echo "❌ Cannot find instance. Please provide SSH key."
        exit 1
    fi
}

echo "ℹ Running update on instance..."
ssh -i community-events-key-prod.pem -o StrictHostKeyChecking=no \
    ubuntu@$INSTANCE_IP 'bash /tmp/update-frontend.sh'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FRONTEND UPDATED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Frontend URL: http://$INSTANCE_IP"
echo ""
echo "ℹ Clear your browser cache (Ctrl+Shift+Delete) and reload"
echo ""
