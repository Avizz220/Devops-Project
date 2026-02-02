# AWS VPC Cleanup Script for us-west-2 (PowerShell)
# This script lists and helps delete unused VPCs to free up quota

$REGION = "us-west-2"
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AWS VPC Cleanup Script" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Listing all VPCs in $REGION..." -ForegroundColor Yellow
Write-Host ""

# Get all non-default VPCs
$vpcsJson = aws ec2 describe-vpcs --region $REGION --query "Vpcs[?IsDefault==``false``]" --output json | ConvertFrom-Json

if ($vpcsJson.Count -eq 0) {
    Write-Host "✅ No non-default VPCs found in $REGION" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($vpcsJson.Count) non-default VPC(s):" -ForegroundColor Yellow
Write-Host ""

$index = 1
foreach ($vpc in $vpcsJson) {
    $vpcId = $vpc.VpcId
    $cidr = $vpc.CidrBlock
    $name = ($vpc.Tags | Where-Object { $_.Key -eq "Name" }).Value
    
    Write-Host "[$index] VPC: $vpcId ($cidr)" -ForegroundColor Cyan
    if ($name) {
        Write-Host "    Name: $name" -ForegroundColor White
    }
    
    # Check for running instances
    $instances = aws ec2 describe-instances --region $REGION `
        --filters "Name=vpc-id,Values=$vpcId" "Name=instance-state-name,Values=running,stopped" `
        --query "Reservations[].Instances[].InstanceId" --output text
    
    if ($instances) {
        Write-Host "    ⚠️  EC2 Instances: $instances" -ForegroundColor Yellow
    } else {
        Write-Host "    ✅ No EC2 instances" -ForegroundColor Green
    }
    
    # Check for subnets
    $subnetCount = (aws ec2 describe-subnets --region $REGION `
        --filters "Name=vpc-id,Values=$vpcId" `
        --query "Subnets[]" --output json | ConvertFrom-Json).Count
    Write-Host "    📦 Subnets: $subnetCount" -ForegroundColor White
    
    # Check for IGWs
    $igwCount = (aws ec2 describe-internet-gateways --region $REGION `
        --filters "Name=attachment.vpc-id,Values=$vpcId" `
        --query "InternetGateways[]" --output json | ConvertFrom-Json).Count
    Write-Host "    🌐 Internet Gateways: $igwCount" -ForegroundColor White
    
    # Check for NAT Gateways
    $natCount = (aws ec2 describe-nat-gateways --region $REGION `
        --filter "Name=vpc-id,Values=$vpcId" "Name=state,Values=available,pending" `
        --query "NatGateways[]" --output json | ConvertFrom-Json).Count
    Write-Host "    🔀 NAT Gateways: $natCount" -ForegroundColor White
    
    Write-Host ""
    $index++
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "⚠️  CLEANUP OPTIONS:" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Delete via AWS Console (Recommended)" -ForegroundColor Yellow
Write-Host "  URL: https://console.aws.amazon.com/vpc/home?region=$REGION#vpcs:" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Delete all resources in old Terraform state:" -ForegroundColor Yellow
Write-Host "  cd terraform" -ForegroundColor White
Write-Host "  terraform destroy -auto-approve" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Manually delete a VPC (if it's empty):" -ForegroundColor Yellow
Write-Host "  aws ec2 delete-vpc --region $REGION --vpc-id <VPC-ID>" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: You must first delete all resources in the VPC:" -ForegroundColor Red
Write-Host "  - Terminate EC2 instances" -ForegroundColor White
Write-Host "  - Delete RDS databases" -ForegroundColor White
Write-Host "  - Delete NAT Gateways" -ForegroundColor White
Write-Host "  - Delete Load Balancers" -ForegroundColor White
Write-Host "  - Detach and delete Internet Gateways" -ForegroundColor White
Write-Host ""
