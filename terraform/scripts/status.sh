#!/bin/bash
# Check status of deployed resources

set -e

cd "$(dirname "$0")/.."

echo "🔍 Checking Terraform Resources Status"
echo "=============================================="

# Get outputs
echo "📊 Deployment Information:"
terraform output

echo ""
echo "=============================================="
echo "🖥️  EC2 Instances Status:"
aws ec2 describe-instances \
    --filters "Name=tag:Project,Values=CommunityEvents" "Name=instance-state-name,Values=running" \
    --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress]' \
    --output table

echo ""
echo "=============================================="
echo "🗄️  RDS Database Status:"
aws rds describe-db-instances \
    --query 'DBInstances[?contains(DBInstanceIdentifier, `community-events`)].{ID:DBInstanceIdentifier,Status:DBInstanceStatus,Endpoint:Endpoint.Address}' \
    --output table

echo ""
echo "=============================================="
echo "⚖️  Load Balancer Status:"
aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?contains(LoadBalancerName, `community-events`)].{Name:LoadBalancerName,DNS:DNSName,State:State.Code}' \
    --output table

echo ""
echo "=============================================="
echo "🎯 Target Group Health:"
ALB_ARN=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `community-events`)].LoadBalancerArn' --output text)
if [ ! -z "$ALB_ARN" ]; then
    TG_ARNS=$(aws elbv2 describe-target-groups --load-balancer-arn "$ALB_ARN" --query 'TargetGroups[].TargetGroupArn' --output text)
    for TG_ARN in $TG_ARNS; do
        echo "Target Group: $(aws elbv2 describe-target-groups --target-group-arns $TG_ARN --query 'TargetGroups[0].TargetGroupName' --output text)"
        aws elbv2 describe-target-health --target-group-arn "$TG_ARN" --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State,TargetHealth.Reason]' --output table
        echo ""
    done
fi

echo "=============================================="
