#!/bin/bash
##############################################################################
# QUICK FIX - Update frontend without SSH
##############################################################################

INSTANCE_ID="i-064119cb154739571"
REGION="us-east-1"

echo "🔄 Quick Update Starting..."

# Create update script
UPDATE_SCRIPT='#!/bin/bash
docker pull avishka2002/community-events-frontend:latest
docker stop community_frontend || true
docker rm community_frontend || true  
docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest
'

# Encode to base64 and save to file
echo "$UPDATE_SCRIPT" | base64 -w 0 > /tmp/userdata.txt

# Stop, update, start
echo "⏸️  Stopping..."
aws ec2 stop-instances --region $REGION --instance-ids $INSTANCE_ID --output text > /dev/null
aws ec2 wait instance-stopped --region $REGION --instance-ids $INSTANCE_ID

echo "🔧 Updating..."
aws ec2 modify-instance-attribute --region $REGION --instance-id $INSTANCE_ID --user-data file:///tmp/userdata.txt

echo "▶️  Starting..."
aws ec2 start-instances --region $REGION --instance-ids $INSTANCE_ID --output text > /dev/null  
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

echo "⏳ Wait 90 seconds for update..."
sleep 90

echo "✅ Done! Visit: http://13.220.61.29"
echo "⚠️  Clear browser cache and reload!"
