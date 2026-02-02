#!/bin/bash
echo "Checking instance status..."

INSTANCE_ID="i-07cfae6222df5ca13"
REGION="us-east-1"

# Check if instance is running
STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $REGION --query 'Reservations[0].Instances[0].State.Name' --output text)
echo "Instance state: $STATE"

# Get console output to see user-data execution
echo ""
echo "=== Console Output (last 50 lines) ==="
aws ec2 get-console-output --instance-id $INSTANCE_ID --region $REGION --query 'Output' --output text | tail -50

echo ""
echo "=== Checking if port 80 is open ==="
nc -zv 3.236.158.24 80 2>&1 || echo "Port 80 not accessible yet"

echo ""
echo "Waiting 30 more seconds..."
sleep 30

echo "Testing again..."
curl -s http://3.236.158.24/api/health || echo "Still not ready"
