#!/bin/bash

##############################################################################
# CHECK DEPLOYMENT STATUS
# Quickly check if the application is running on AWS
##############################################################################

INSTANCE_ID="i-064119cb154739571"
AWS_REGION="us-east-1"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region $AWS_REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "============================================"
echo "Instance: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "============================================"
echo ""

echo "Testing endpoints..."
echo ""

# Test frontend
echo -n "Frontend (http://$PUBLIC_IP): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP)
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    echo "✓ OK (HTTP $HTTP_CODE)"
else
    echo "✗ FAILED (HTTP $HTTP_CODE)"
fi

# Test backend health
echo -n "Backend Health (http://$PUBLIC_IP:4000/api/health): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:4000/api/health)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✓ OK (HTTP $HTTP_CODE)"
else
    echo "✗ FAILED (HTTP $HTTP_CODE)"
fi

# Test backend API
echo -n "Backend API (http://$PUBLIC_IP:4000/api/events): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:4000/api/events)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✓ OK (HTTP $HTTP_CODE)"
else
    echo "✗ FAILED (HTTP $HTTP_CODE)"
fi

echo ""
echo "============================================"
echo "Access URLs:"
echo "  Frontend: http://$PUBLIC_IP"
echo "  Backend:  http://$PUBLIC_IP:4000"
echo "============================================"
