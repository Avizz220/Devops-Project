# PowerShell Deployment Script for Windows

Write-Host "🚀 Starting Terraform Deployment for Community Events App" -ForegroundColor Cyan
Write-Host "==============================================`n"

# Navigate to terraform directory
Set-Location $PSScriptRoot\..

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials verified" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured!" -ForegroundColor Red
    Write-Host "Please run: aws configure"
    exit 1
}

# Check if SSH key exists
$KeyName = "community-events-key"
try {
    aws ec2 describe-key-pairs --key-names $KeyName 2>$null | Out-Null
    Write-Host "✅ SSH key pair '$KeyName' exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️  SSH key pair '$KeyName' not found!" -ForegroundColor Yellow
    Write-Host "Creating SSH key pair..."
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir | Out-Null
    }
    aws ec2 create-key-pair --key-name $KeyName --query 'KeyMaterial' --output text | Out-File -FilePath "$sshDir\$KeyName.pem" -Encoding ASCII
    Write-Host "✅ Created SSH key pair: $sshDir\$KeyName.pem" -ForegroundColor Green
}

# Initialize Terraform
Write-Host "`n📦 Initializing Terraform..." -ForegroundColor Cyan
terraform init

# Validate configuration
Write-Host "`n🔍 Validating Terraform configuration..." -ForegroundColor Cyan
terraform validate

# Format Terraform files
Write-Host "`n📝 Formatting Terraform files..." -ForegroundColor Cyan
terraform fmt -recursive

# Plan deployment
Write-Host "`n📋 Planning Terraform deployment..." -ForegroundColor Cyan
terraform plan -out=tfplan

# Ask for confirmation
Write-Host ""
$confirm = Read-Host "Do you want to apply this plan? (yes/no)"

if ($confirm -eq "yes") {
    Write-Host "`n🚀 Applying Terraform configuration..." -ForegroundColor Cyan
    terraform apply tfplan
    
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host "==============================================`n" -ForegroundColor Green
    
    # Show outputs
    terraform output
    
    Write-Host "`n📌 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 5-10 minutes for EC2 instances to download and start Docker containers"
    Write-Host "2. Access your application at the ALB URL shown above"
    Write-Host "3. Check EC2 instance logs: ssh -i ~/.ssh/$KeyName.pem ec2-user@<instance-ip>"
    Write-Host "4. View Docker logs: docker logs community_events_backend"
} else {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 0
}
