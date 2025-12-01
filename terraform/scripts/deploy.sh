#!/bin/bash
# Terraform Deployment Script for Development Environment

set -e

echo "🚀 Starting Terraform Deployment for Community Events App"
echo "=============================================="

# Navigate to terraform directory
cd "$(dirname "$0")/.."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured!"
    echo "Please run: aws configure"
    exit 1
fi

echo "✅ AWS credentials verified"

# Check if SSH key exists
KEY_NAME="community-events-key"
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" > /dev/null 2>&1; then
    echo "⚠️  SSH key pair '$KEY_NAME' not found!"
    echo "Creating SSH key pair..."
    aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo "✅ Created SSH key pair: ~/.ssh/${KEY_NAME}.pem"
else
    echo "✅ SSH key pair '$KEY_NAME' exists"
fi

# Initialize Terraform
echo ""
echo "📦 Initializing Terraform..."
terraform init

# Validate configuration
echo ""
echo "🔍 Validating Terraform configuration..."
terraform validate

# Format Terraform files
echo ""
echo "📝 Formatting Terraform files..."
terraform fmt -recursive

# Plan deployment
echo ""
echo "📋 Planning Terraform deployment..."
terraform plan -out=tfplan

# Ask for confirmation
echo ""
read -p "Do you want to apply this plan? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "🚀 Applying Terraform configuration..."
    terraform apply tfplan
    
    echo ""
    echo "=============================================="
    echo "✅ Deployment Complete!"
    echo "=============================================="
    
    # Show outputs
    terraform output
    
    echo ""
    echo "📌 Next Steps:"
    echo "1. Wait 5-10 minutes for EC2 instances to download and start Docker containers"
    echo "2. Access your application at the ALB URL shown above"
    echo "3. Check EC2 instance logs: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@<instance-ip>"
    echo "4. View Docker logs: docker logs community_events_backend"
    
else
    echo "❌ Deployment cancelled"
    rm -f tfplan
    exit 0
fi
