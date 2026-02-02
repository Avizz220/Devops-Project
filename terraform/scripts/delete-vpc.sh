#!/bin/bash

# Script to delete an empty VPC and its dependencies
# Usage: ./delete-vpc.sh <VPC-ID>

set -e

REGION="us-west-2"
VPC_ID=$1

if [ -z "$VPC_ID" ]; then
    echo "Usage: $0 <VPC-ID>"
    exit 1
fi

echo "========================================="
echo "Deleting VPC: $VPC_ID"
echo "Region: $REGION"
echo "========================================="
echo ""

# Function to delete resources
delete_vpc_resources() {
    local VPC=$1
    
    echo "🔍 Checking for resources in VPC $VPC..."
    
    # 1. Delete NAT Gateways
    echo "Checking for NAT Gateways..."
    NAT_GWS=$(aws ec2 describe-nat-gateways --region $REGION \
        --filter "Name=vpc-id,Values=$VPC" "Name=state,Values=available" \
        --query "NatGateways[].NatGatewayId" --output text)
    
    if [ -n "$NAT_GWS" ]; then
        for NAT_GW in $NAT_GWS; do
            echo "  🗑️  Deleting NAT Gateway: $NAT_GW"
            aws ec2 delete-nat-gateway --region $REGION --nat-gateway-id $NAT_GW
        done
        echo "  ⏳ Waiting for NAT Gateways to be deleted..."
        sleep 30
    fi
    
    # 2. Release Elastic IPs associated with NAT Gateways
    echo "Checking for Elastic IPs..."
    EIPS=$(aws ec2 describe-addresses --region $REGION \
        --query "Addresses[?Domain=='vpc'].AllocationId" --output text)
    
    if [ -n "$EIPS" ]; then
        for EIP in $EIPS; do
            echo "  🗑️  Releasing Elastic IP: $EIP"
            aws ec2 release-address --region $REGION --allocation-id $EIP 2>/dev/null || true
        done
    fi
    
    # 3. Delete EC2 Instances
    echo "Checking for EC2 Instances..."
    INSTANCES=$(aws ec2 describe-instances --region $REGION \
        --filters "Name=vpc-id,Values=$VPC" "Name=instance-state-name,Values=running,stopped" \
        --query "Reservations[].Instances[].InstanceId" --output text)
    
    if [ -n "$INSTANCES" ]; then
        echo "  🗑️  Terminating EC2 Instances: $INSTANCES"
        aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCES
        echo "  ⏳ Waiting for instances to terminate..."
        aws ec2 wait instance-terminated --region $REGION --instance-ids $INSTANCES
    fi
    
    # 4. Detach and Delete Internet Gateways
    echo "Checking for Internet Gateways..."
    IGWS=$(aws ec2 describe-internet-gateways --region $REGION \
        --filters "Name=attachment.vpc-id,Values=$VPC" \
        --query "InternetGateways[].InternetGatewayId" --output text)
    
    if [ -n "$IGWS" ]; then
        for IGW in $IGWS; do
            echo "  🔌 Detaching Internet Gateway: $IGW"
            aws ec2 detach-internet-gateway --region $REGION --internet-gateway-id $IGW --vpc-id $VPC
            echo "  🗑️  Deleting Internet Gateway: $IGW"
            aws ec2 delete-internet-gateway --region $REGION --internet-gateway-id $IGW
        done
    fi
    
    # 5. Delete Subnets
    echo "Checking for Subnets..."
    SUBNETS=$(aws ec2 describe-subnets --region $REGION \
        --filters "Name=vpc-id,Values=$VPC" \
        --query "Subnets[].SubnetId" --output text)
    
    if [ -n "$SUBNETS" ]; then
        for SUBNET in $SUBNETS; do
            echo "  🗑️  Deleting Subnet: $SUBNET"
            aws ec2 delete-subnet --region $REGION --subnet-id $SUBNET
        done
    fi
    
    # 6. Delete Route Tables (except main)
    echo "Checking for Route Tables..."
    ROUTE_TABLES=$(aws ec2 describe-route-tables --region $REGION \
        --filters "Name=vpc-id,Values=$VPC" \
        --query "RouteTables[?Associations[0].Main!=\`true\`].RouteTableId" --output text)
    
    if [ -n "$ROUTE_TABLES" ]; then
        for RT in $ROUTE_TABLES; do
            echo "  🗑️  Deleting Route Table: $RT"
            aws ec2 delete-route-table --region $REGION --route-table-id $RT
        done
    fi
    
    # 7. Delete Security Groups (except default)
    echo "Checking for Security Groups..."
    SGS=$(aws ec2 describe-security-groups --region $REGION \
        --filters "Name=vpc-id,Values=$VPC" \
        --query "SecurityGroups[?GroupName!='default'].GroupId" --output text)
    
    if [ -n "$SGS" ]; then
        for SG in $SGS; do
            echo "  🗑️  Deleting Security Group: $SG"
            aws ec2 delete-security-group --region $REGION --group-id $SG 2>/dev/null || true
        done
    fi
    
    # 8. Finally, delete the VPC
    echo ""
    echo "🗑️  Deleting VPC: $VPC"
    aws ec2 delete-vpc --region $REGION --vpc-id $VPC
    
    echo ""
    echo "✅ VPC $VPC deleted successfully!"
}

# Execute deletion
delete_vpc_resources $VPC_ID

echo ""
echo "========================================="
echo "✅ Cleanup Complete!"
echo "========================================="
