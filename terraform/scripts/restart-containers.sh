#!/bin/bash
# Script to restart containers on EC2 instance with latest images

INSTANCE_ID="i-07fd35148d6ca9439"
REGION="us-west-2"

echo "Restarting containers on instance $INSTANCE_ID..."

aws ssm send-command \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --instance-ids "$INSTANCE_ID" \
  --parameters 'commands=["cd /home/ec2-user","docker-compose down","docker-compose pull","docker-compose up -d","docker ps"]' \
  --output text \
  --query 'Command.CommandId'
