#!/bin/bash
# Terraform Destroy Script - Clean up all AWS resources

set -e

echo "🗑️  Terraform Destroy - Community Events App"
echo "=============================================="
echo "⚠️  WARNING: This will DELETE all AWS resources!"
echo ""

# Navigate to terraform directory
cd "$(dirname "$0")/.."

# Ask for confirmation
read -p "Are you sure you want to destroy all resources? (type 'destroy' to confirm): " confirm

if [ "$confirm" != "destroy" ]; then
    echo "❌ Destroy cancelled"
    exit 0
fi

echo ""
echo "🗑️  Destroying all Terraform resources..."
terraform destroy -auto-approve

echo ""
echo "=============================================="
echo "✅ All resources destroyed!"
echo "=============================================="
echo ""
echo "💡 Note: The SSH key pair still exists in AWS"
echo "To remove it: aws ec2 delete-key-pair --key-name community-events-key"
