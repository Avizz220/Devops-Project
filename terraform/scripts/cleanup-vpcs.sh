#!/bin/bash

# AWS VPC Cleanup Script for us-west-2
# This script lists and helps delete unused VPCs to free up quota

set -e

REGION="us-west-2"

echo "========================================="
echo "AWS VPC Cleanup Script"
echo "Region: $REGION"
echo "========================================="
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "📋 Listing all VPCs in $REGION..."
echo ""

# Get all VPCs
VPCS=$(aws ec2 describe-vpcs --region $REGION --query "Vpcs[?IsDefault==\`false\`].[VpcId,CidrBlock,Tags[?Key=='Name'].Value|[0]]" --output text)

if [ -z "$VPCS" ]; then
    echo "✅ No non-default VPCs found in $REGION"
    exit 0
fi

echo "Found VPCs:"
echo "$VPCS" | nl
echo ""

# Count VPCs
VPC_COUNT=$(echo "$VPCS" | wc -l)
echo "Total non-default VPCs: $VPC_COUNT"
echo ""

# Show VPC details with resources
echo "========================================="
echo "VPC Details:"
echo "========================================="
echo ""

while IFS=$'\t' read -r VPC_ID CIDR NAME; do
    echo "🔹 VPC: $VPC_ID ($CIDR) - Name: $NAME"
    
    # Check for running instances
    INSTANCES=$(aws ec2 describe-instances --region $REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=instance-state-name,Values=running,stopped" \
        --query "Reservations[].Instances[].InstanceId" --output text)
    
    if [ -n "$INSTANCES" ]; then
        echo "  ⚠️  EC2 Instances: $INSTANCES"
    else
        echo "  ✅ No EC2 instances"
    fi
    
    # Check for subnets
    SUBNET_COUNT=$(aws ec2 describe-subnets --region $REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query "length(Subnets)" --output text)
    echo "  📦 Subnets: $SUBNET_COUNT"
    
    # Check for IGWs
    IGW_COUNT=$(aws ec2 describe-internet-gateways --region $REGION \
        --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
        --query "length(InternetGateways)" --output text)
    echo "  🌐 Internet Gateways: $IGW_COUNT"
    
    echo ""
done <<< "$VPCS"

echo "========================================="
echo "⚠️  CLEANUP OPTIONS:"
echo "========================================="
echo ""
echo "To delete a specific VPC, you need to first:"
echo "1. Terminate all EC2 instances in the VPC"
echo "2. Delete all dependent resources (RDS, NAT Gateways, etc.)"
echo "3. Then delete the VPC"
echo ""
echo "To delete a VPC automatically (if empty):"
echo "  ./cleanup-vpcs.sh delete <VPC-ID>"
echo ""
echo "Or manually using AWS Console:"
echo "  https://console.aws.amazon.com/vpc/home?region=$REGION#vpcs:"
echo ""
