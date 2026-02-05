#!/bin/bash
# Deploy script to restart containers on EC2 after new images are pushed

set -e

EC2_INSTANCE_ID="${1}"
AWS_REGION="${2:-us-east-1}"

if [ -z "$EC2_INSTANCE_ID" ]; then
    echo "Usage: $0 <instance-id> [aws-region]"
    exit 1
fi

echo "🚀 Deploying to EC2 instance: $EC2_INSTANCE_ID in region: $AWS_REGION"

# Run commands on EC2 via SSM
aws ssm send-command \
    --instance-ids "$EC2_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy latest Docker images" \
    --parameters commands='[
        "cd /opt/community-events",
        "sudo docker-compose pull",
        "sudo docker-compose up -d",
        "sleep 10",
        "sudo docker-compose ps"
    ]' \
    --output text

echo "✅ Deployment command sent to EC2!"
echo "Wait 30 seconds, then check: http://$(aws ec2 describe-instances --instance-ids $EC2_INSTANCE_ID --region $AWS_REGION --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"
