#!/bin/bash

##############################################################################
# SINGLE COMMAND TO FIX FRONTEND - Copy and paste this entire block
##############################################################################

# Configuration
INSTANCE_IP="13.220.61.29"

echo "🔄 Updating frontend on $INSTANCE_IP..."
echo ""

# Try to update via EC2 Instance Connect / SSH
if [ -f "community-events-key-prod.pem" ]; then
    echo "✓ SSH key found, using SSH..."
    ssh -i community-events-key-prod.pem -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'ENDSSH'
sudo docker pull avishka2002/community-events-frontend:latest && \
sudo docker stop community_frontend && \
sudo docker rm community_frontend && \
sudo docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest && \
sleep 5 && \
echo "✅ Frontend updated!" && \
sudo docker ps | grep community
ENDSSH
else
    echo "❌ SSH key not found."
    echo ""
    echo "Please use EC2 Instance Connect instead:"
    echo "1. Go to AWS Console → EC2 → Instances (us-east-1 region)"
    echo "2. Select instance i-064119cb154739571"
    echo "3. Click 'Connect' → 'EC2 Instance Connect'"
    echo "4. Run these commands:"
    echo ""
    echo "sudo docker pull avishka2002/community-events-frontend:latest"
    echo "sudo docker stop community_frontend && sudo docker rm community_frontend"
    echo "sudo docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest"
    echo "sudo docker ps"
    echo ""
    exit 1
fi

# Verify
echo ""
echo "🔍 Verifying..."
sleep 10

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$INSTANCE_IP/)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo "⚠ Frontend returned HTTP $HTTP_CODE (may need more time)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ UPDATE COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Open: http://$INSTANCE_IP"
echo "⚠ Clear browser cache (Ctrl+Shift+Delete) and reload!"
echo ""
