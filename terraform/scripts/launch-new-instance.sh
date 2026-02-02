#!/bin/bash
set -e

echo "Launching new EC2 instance..."

# Encode user data
USER_DATA=$(base64 -w 0 < terraform/scripts/setup-instance.sh)

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0e3008cbd8722baf0 \
  --instance-type t3.micro \
  --subnet-id subnet-02265cf2df801efa1 \
  --security-group-ids sg-038dd0786ea485110 \
  --user-data "$USER_DATA" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=community-events-production},{Key=Project,Value=DevOps}]' \
  --region us-east-1 \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance launched: $INSTANCE_ID"
echo "Waiting for instance to start..."

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region us-east-1

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region us-east-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo ""
echo "======================================"
echo "✅ Instance Created Successfully!"
echo "======================================"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "Waiting 2 minutes for user-data setup to complete..."
sleep 120

echo ""
echo "Testing deployment..."
curl -s http://$PUBLIC_IP/api/health && echo "" || echo "Backend starting..."

echo ""
echo "======================================"
echo "Your site is deploying at:"
echo "http://$PUBLIC_IP"
echo "======================================"
echo ""
echo "Save this for GitHub Actions:"
echo "INSTANCE_ID=$INSTANCE_ID"
echo "PUBLIC_IP=$PUBLIC_IP"
