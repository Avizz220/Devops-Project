#!/bin/bash

##############################################################################
# UPDATE FRONTEND VIA USER DATA - NO SSH NEEDED
# This stops the instance, updates user data, and restarts it
##############################################################################

set -e

INSTANCE_ID="i-064119cb154739571"
REGION="us-east-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 UPDATING FRONTEND VIA USER DATA (No SSH Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get current state
echo "📋 Checking instance state..."
STATE=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)

echo "Current state: $STATE"
echo ""

# Stop instance if running
if [ "$STATE" == "running" ]; then
    echo "⏸️  Stopping instance..."
    aws ec2 stop-instances --region $REGION --instance-ids $INSTANCE_ID --output text
    
    echo "⏳ Waiting for instance to stop (30-60 seconds)..."
    aws ec2 wait instance-stopped --region $REGION --instance-ids $INSTANCE_ID
    echo "✅ Instance stopped"
    echo ""
fi

# Create user data script
echo "📝 Creating update script..."
USER_DATA=$(cat << 'USERDATA' | base64 -w 0
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== User Data Script Started at $(date) ==="

# Wait for Docker to be available
for i in {1..30}; do
    if command -v docker &> /dev/null; then
        echo "Docker is available"
        break
    fi
    echo "Waiting for Docker... ($i/30)"
    sleep 2
done

# Pull latest frontend image
echo "Pulling latest frontend image..."
docker pull avishka2002/community-events-frontend:latest

# Stop and remove old container
echo "Stopping old frontend container..."
docker stop community_frontend 2>/dev/null || true
docker rm community_frontend 2>/dev/null || true

# Start new container
echo "Starting new frontend container..."
docker run -d \
    --name community_frontend \
    --restart unless-stopped \
    -p 80:80 \
    --network community-network \
    avishka2002/community-events-frontend:latest

# Wait and verify
sleep 10
echo "Container status:"
docker ps | grep community

echo "=== User Data Script Completed at $(date) ==="
USERDATA
)

# Update user data
echo "🔧 Updating instance user data..."
aws ec2 modify-instance-attribute \
    --region $REGION \
    --instance-id $INSTANCE_ID \
    --user-data "$USER_DATA"

echo "✅ User data updated"
echo ""

# Start instance
echo "▶️  Starting instance..."
aws ec2 start-instances --region $REGION --instance-ids $INSTANCE_ID --output text

echo "⏳ Waiting for instance to start..."
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

# Get IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance started"
echo ""

echo "⏳ Waiting for user data script to complete (60 seconds)..."
echo "   The instance needs to:"
echo "   1. Boot up"
echo "   2. Run user data script"
echo "   3. Pull new Docker image"
echo "   4. Restart frontend container"
echo ""

for i in {60..1}; do
    echo -ne "   Waiting... $i seconds remaining\r"
    sleep 1
done
echo ""
echo ""

# Test the update
echo "🔍 Testing frontend..."
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  Frontend returned HTTP $HTTP_CODE"
    echo "   It may need a few more seconds to fully start"
fi

# Test API proxy
echo "🔍 Testing API proxy..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP/api/ping 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ API proxy is working (HTTP $HTTP_CODE)"
else
    echo "⚠️  API proxy returned HTTP $HTTP_CODE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ UPDATE COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend URL: http://$PUBLIC_IP"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://$PUBLIC_IP in your browser"
echo "   2. Clear browser cache (Ctrl+Shift+Delete)"
echo "   3. Hard reload (Ctrl+F5)"
echo "   4. Try logging in - the backend connection should work now!"
echo ""
echo "💡 If still not working after 2 minutes:"
echo "   Run: ./check-deployment.sh"
echo ""
echo "📝 To see what happened during update:"
echo "   We would need SSH access to check /var/log/user-data.log"
echo ""
