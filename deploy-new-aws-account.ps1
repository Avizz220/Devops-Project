# Automated Deployment Script for New AWS Account
# Run this AFTER completing manual setup steps

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   AUTOMATED AWS DEPLOYMENT - New Account Setup" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ROOT = $PSScriptRoot
$TERRAFORM_DIR = Join-Path $PROJECT_ROOT "terraform"

# Step 1: Check Prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found! Please install it first:" -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if Terraform is installed
try {
    $tfVersion = terraform --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Terraform installed: $tfVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform not found! Installing..." -ForegroundColor Yellow
    
    # Install Terraform via Chocolatey or download
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install terraform -y
    } else {
        Write-Host "   Download from: https://www.terraform.io/downloads" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Verify AWS Credentials
Write-Host ""
Write-Host "[2/8] Verifying AWS credentials..." -ForegroundColor Yellow

try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ Connected to AWS Account:" -ForegroundColor Green
    Write-Host "   Account ID: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "   User ARN: $($identity.Arn)" -ForegroundColor Cyan
    
    # Confirm this is the correct account
    Write-Host ""
    $confirmation = Read-Host "Is this your NEW AWS account? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "❌ Please configure AWS CLI with correct credentials:" -ForegroundColor Red
        Write-Host "   Run: aws configure" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to verify AWS credentials!" -ForegroundColor Red
    Write-Host "   Run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Step 3: Clean Old Terraform State
Write-Host ""
Write-Host "[3/8] Cleaning old Terraform state..." -ForegroundColor Yellow

Push-Location $TERRAFORM_DIR

if (Test-Path "terraform.tfstate") {
    Write-Host "⚠️  Found old terraform.tfstate file" -ForegroundColor Yellow
    
    # Backup old state
    $backupFile = "terraform.tfstate.old-account-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item "terraform.tfstate" $backupFile
    Write-Host "   Backed up to: $backupFile" -ForegroundColor Cyan
    
    # Remove old state
    Remove-Item "terraform.tfstate" -Force
    Write-Host "✅ Removed old state file" -ForegroundColor Green
}

if (Test-Path "terraform.tfstate.backup") {
    $backupFile = "terraform.tfstate.backup.old-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item "terraform.tfstate.backup" $backupFile
    Remove-Item "terraform.tfstate.backup" -Force
    Write-Host "✅ Removed old backup state file" -ForegroundColor Green
}

if (Test-Path ".terraform") {
    Remove-Item ".terraform" -Recurse -Force
    Write-Host "✅ Removed old Terraform cache" -ForegroundColor Green
}

if (Test-Path ".terraform.lock.hcl") {
    Remove-Item ".terraform.lock.hcl" -Force
    Write-Host "✅ Removed old Terraform lock file" -ForegroundColor Green
}

# Step 4: Verify Key Pair Exists
Write-Host ""
Write-Host "[4/8] Verifying EC2 Key Pair..." -ForegroundColor Yellow

$keyName = "community-events-key"
try {
    $keyPair = aws ec2 describe-key-pairs --key-names $keyName --region us-west-2 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Key pair '$keyName' found in us-west-2" -ForegroundColor Green
    } else {
        throw "Key pair not found"
    }
} catch {
    Write-Host "❌ Key pair '$keyName' not found in us-west-2!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create it manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor Cyan
    Write-Host "2. Change region to 'us-west-2' (top right)" -ForegroundColor Cyan
    Write-Host "3. Left menu → Key Pairs → Create key pair" -ForegroundColor Cyan
    Write-Host "4. Name: community-events-key" -ForegroundColor Cyan
    Write-Host "5. Type: RSA, Format: .pem" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Have you created the key pair? (yes/no)"
    if ($continue -ne "yes") {
        exit 1
    }
}

# Step 5: Initialize Terraform
Write-Host ""
Write-Host "[5/8] Initializing Terraform..." -ForegroundColor Yellow

terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform initialization failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Terraform initialized successfully" -ForegroundColor Green

# Step 6: Validate Terraform Configuration
Write-Host ""
Write-Host "[6/8] Validating Terraform configuration..." -ForegroundColor Yellow

terraform validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform validation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Terraform configuration valid" -ForegroundColor Green

# Step 7: Plan Terraform Deployment
Write-Host ""
Write-Host "[7/8] Creating Terraform deployment plan..." -ForegroundColor Yellow

terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform plan failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Terraform plan created" -ForegroundColor Green

# Show what will be created
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   RESOURCES TO BE CREATED" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Ask for confirmation
Write-Host ""
Write-Host "Review the plan above. This will create:" -ForegroundColor Yellow
Write-Host "  • VPC with subnets" -ForegroundColor White
Write-Host "  • Security groups" -ForegroundColor White
Write-Host "  • EC2 instance (t2.micro)" -ForegroundColor White
Write-Host "  • Application deployment" -ForegroundColor White
Write-Host ""
$deploy = Read-Host "Do you want to proceed with deployment? (yes/no)"

if ($deploy -ne "yes") {
    Write-Host "❌ Deployment cancelled by user" -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# Step 8: Apply Terraform
Write-Host ""
Write-Host "[8/8] Deploying infrastructure to AWS..." -ForegroundColor Yellow
Write-Host "⏳ This will take 5-10 minutes..." -ForegroundColor Cyan

terraform apply tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform deployment failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "   ✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Get outputs
Write-Host ""
Write-Host "Getting deployment information..." -ForegroundColor Yellow

$outputs = terraform output -json | ConvertFrom-Json

Write-Host ""
Write-Host "🎉 Your application is deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Details:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($outputs.ec2_public_ips) {
    Write-Host "🌐 Application URL: http://$($outputs.ec2_public_ips.value[0])" -ForegroundColor Green
    Write-Host "🖥️  EC2 Public IP: $($outputs.ec2_public_ips.value[0])" -ForegroundColor White
}

if ($outputs.ec2_instance_ids) {
    Write-Host "📦 EC2 Instance ID: $($outputs.ec2_instance_ids.value[0])" -ForegroundColor White
}

Write-Host ""
Write-Host "⏳ Note: Application containers may take 2-3 minutes to start" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 To check application status:" -ForegroundColor Cyan
Write-Host "   aws ec2 describe-instances --instance-ids $($outputs.ec2_instance_ids.value[0]) --region us-west-2" -ForegroundColor White
Write-Host ""
Write-Host "📝 To view all outputs:" -ForegroundColor Cyan
Write-Host "   terraform output" -ForegroundColor White

Pop-Location

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   NEXT STEPS" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait 2-3 minutes for containers to start" -ForegroundColor White
Write-Host "2. Open the application URL in your browser" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
Write-Host "4. Configure your domain (optional)" -ForegroundColor White
Write-Host ""
Write-Host "💡 To destroy resources when done:" -ForegroundColor Yellow
Write-Host "   cd terraform" -ForegroundColor White
Write-Host "   terraform destroy" -ForegroundColor White
Write-Host ""
