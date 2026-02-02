#!/bin/bash
echo "Monitoring deployment..."
echo ""

for i in {1..15}; do
  echo "[$i/15] Testing http://3.236.158.24/api/health"
  
  RESPONSE=$(curl -s http://3.236.158.24/api/health 2>&1)
  
  if [[ $RESPONSE == *"status"* ]] || [[ $RESPONSE == *"OK"* ]]; then
    echo "✅ BACKEND IS UP!"
    echo "Response: $RESPONSE"
    echo ""
    echo "Testing events endpoint..."
    curl -s http://3.236.158.24/api/events || echo "Events loading..."
    echo ""
    echo "========================================" 
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================================" 
    echo "Frontend: http://3.236.158.24"
    echo "Backend: http://3.236.158.24:4000"
    echo "========================================"
    exit 0
  fi
  
  echo "   Status: Still starting... ($RESPONSE)"
  sleep 20
done

echo ""
echo "Setup taking longer than expected. Check instance console manually."
aws ec2 get-console-output --instance-id i-07cfae6222df5ca13 --region us-east-1 --query 'Output' --output text | tail -100
