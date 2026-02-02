#!/bin/bash

# Automated Deployment Script for New AWS Account
# Run this AFTER completing manual setup steps

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=================================================================="
echo -e "   AUTOMATED AWS DEPLOYMENT - New Account Setup"
echo -e "==================================================================${NC}"
echo ""

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Step 1: Check Prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    echo -e "${GREEN}✅ AWS CLI installed: $AWS_VERSION${NC}"
else
    echo -e "${RED}❌ AWS CLI not found! Please install it first:${NC}"
    echo -e "${YELLOW}   Download from: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

# Check if Terraform is installed
if command -v terraform &> /dev/null; then
    TF_VERSION=$(terraform --version | head -n1)
    echo -e "${GREEN}✅ Terraform installed: $TF_VERSION${NC}"
else
    echo -e "${RED}❌ Terraform not found!${NC}"
    echo -e "${YELLOW}Installing Terraform...${NC}"
    
    # Install Terraform
    wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
    unzip -o terraform_1.5.0_linux_amd64.zip
    sudo mv terraform /usr/local/bin/
    rm terraform_1.5.0_linux_amd64.zip
    
    echo -e "${GREEN}✅ Terraform installed successfully${NC}"
fi

# Step 2: Verify AWS Credentials
echo ""
echo -e "${YELLOW}[2/8] Verifying AWS credentials...${NC}"

IDENTITY=$(aws sts get-caller-identity --output json 2>&1)
if [ $? -eq 0 ]; then
    ACCOUNT_ID=$(echo $IDENTITY | jq -r '.Account')
    USER_ARN=$(echo $IDENTITY | jq -r '.Arn')
    
    echo -e "${GREEN}✅ Connected to AWS Account:${NC}"
    echo -e "${CYAN}   Account ID: $ACCOUNT_ID${NC}"
    echo -e "${CYAN}   User ARN: $USER_ARN${NC}"
    
    # Confirm this is the correct account
    echo ""
    read -p "Is this your NEW AWS account? (yes/no): " confirmation
    if [ "$confirmation" != "yes" ]; then
        echo -e "${RED}❌ Please configure AWS CLI with correct credentials:${NC}"
        echo -e "${YELLOW}   Run: aws configure${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to verify AWS credentials!${NC}"
    echo -e "${YELLOW}   Run: aws configure${NC}"
    exit 1
fi

# Step 3: Clean Old Terraform State
echo ""
echo -e "${YELLOW}[3/8] Cleaning old Terraform state...${NC}"

cd "$TERRAFORM_DIR"

if [ -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}⚠️  Found old terraform.tfstate file${NC}"
    
    # Backup old state
    BACKUP_FILE="terraform.tfstate.old-account-$(date +%Y%m%d-%H%M%S)"
    cp "terraform.tfstate" "$BACKUP_FILE"
    echo -e "${CYAN}   Backed up to: $BACKUP_FILE${NC}"
    
    # Remove old state
    rm -f "terraform.tfstate"
    echo -e "${GREEN}✅ Removed old state file${NC}"
fi

if [ -f "terraform.tfstate.backup" ]; then
    BACKUP_FILE="terraform.tfstate.backup.old-$(date +%Y%m%d-%H%M%S)"
    cp "terraform.tfstate.backup" "$BACKUP_FILE"
    rm -f "terraform.tfstate.backup"
    echo -e "${GREEN}✅ Removed old backup state file${NC}"
fi

if [ -d ".terraform" ]; then
    rm -rf ".terraform"
    echo -e "${GREEN}✅ Removed old Terraform cache${NC}"
fi

if [ -f ".terraform.lock.hcl" ]; then
    rm -f ".terraform.lock.hcl"
    echo -e "${GREEN}✅ Removed old Terraform lock file${NC}"
fi

# Step 4: Verify Key Pair Exists
echo ""
echo -e "${YELLOW}[4/8] Verifying EC2 Key Pair...${NC}"

KEY_NAME="community-events-key"
KEY_CHECK=$(aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region us-west-2 2>&1 || true)

if echo "$KEY_CHECK" | grep -q "KeyName"; then
    echo -e "${GREEN}✅ Key pair '$KEY_NAME' found in us-west-2${NC}"
else
    echo -e "${RED}❌ Key pair '$KEY_NAME' not found in us-west-2!${NC}"
    echo ""
    echo -e "${YELLOW}Please create it manually:${NC}"
    echo -e "${CYAN}1. Go to: https://console.aws.amazon.com/ec2/${NC}"
    echo -e "${CYAN}2. Change region to 'us-west-2' (top right)${NC}"
    echo -e "${CYAN}3. Left menu → Key Pairs → Create key pair${NC}"
    echo -e "${CYAN}4. Name: community-events-key${NC}"
    echo -e "${CYAN}5. Type: RSA, Format: .pem${NC}"
    echo ""
    read -p "Have you created the key pair? (yes/no): " cont
    if [ "$cont" != "yes" ]; then
        exit 1
    fi
fi

# Step 5: Initialize Terraform
echo ""
echo -e "${YELLOW}[5/8] Initializing Terraform...${NC}"

terraform init
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform initialization failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Terraform initialized successfully${NC}"

# Step 6: Validate Terraform Configuration
echo ""
echo -e "${YELLOW}[6/8] Validating Terraform configuration...${NC}"

terraform validate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform validation failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Terraform configuration valid${NC}"

# Step 7: Plan Terraform Deployment
echo ""
echo -e "${YELLOW}[7/8] Creating Terraform deployment plan...${NC}"

terraform plan -out=tfplan
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform plan failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Terraform plan created${NC}"

# Show what will be created
echo ""
echo -e "${CYAN}=================================================================="
echo -e "   RESOURCES TO BE CREATED"
echo -e "==================================================================${NC}"

# Ask for confirmation
echo ""
echo -e "${YELLOW}Review the plan above. This will create:${NC}"
echo -e "${NC}  • VPC with subnets"
echo -e "  • Security groups"
echo -e "  • EC2 instance (t2.micro)"
echo -e "  • Application deployment"
echo ""
read -p "Do you want to proceed with deployment? (yes/no): " deploy

if [ "$deploy" != "yes" ]; then
    echo -e "${YELLOW}❌ Deployment cancelled by user${NC}"
    exit 0
fi

# Step 8: Apply Terraform
echo ""
echo -e "${YELLOW}[8/8] Deploying infrastructure to AWS...${NC}"
echo -e "${CYAN}⏳ This will take 5-10 minutes...${NC}"

terraform apply tfplan
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================================================="
echo -e "   ✅ DEPLOYMENT SUCCESSFUL!"
echo -e "==================================================================${NC}"

# Get outputs
echo ""
echo -e "${YELLOW}Getting deployment information...${NC}"

# Get EC2 public IP
EC2_IP=$(terraform output -json | jq -r '.ec2_public_ips.value[0]' 2>/dev/null || echo "")
EC2_ID=$(terraform output -json | jq -r '.ec2_instance_ids.value[0]' 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}🎉 Your application is deployed!${NC}"
echo ""
echo -e "${CYAN}📋 Deployment Details:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$EC2_IP" ]; then
    echo -e "${GREEN}🌐 Application URL: http://$EC2_IP${NC}"
    echo -e "${NC}🖥️  EC2 Public IP: $EC2_IP"
fi

if [ -n "$EC2_ID" ]; then
    echo -e "${NC}📦 EC2 Instance ID: $EC2_ID"
fi

echo ""
echo -e "${YELLOW}⏳ Note: Application containers may take 2-3 minutes to start${NC}"
echo ""
echo -e "${CYAN}🔍 To check application status:${NC}"
echo -e "${NC}   aws ec2 describe-instances --instance-ids $EC2_ID --region us-west-2"
echo ""
echo -e "${CYAN}📝 To view all outputs:${NC}"
echo -e "${NC}   terraform output"

cd "$PROJECT_ROOT"

echo ""
echo -e "${CYAN}=================================================================="
echo -e "   NEXT STEPS"
echo -e "==================================================================${NC}"
echo ""
echo -e "${NC}1. Wait 2-3 minutes for containers to start"
echo -e "2. Open the application URL in your browser"
echo -e "3. Test the application"
echo -e "4. Configure your domain (optional)"
echo ""
echo -e "${YELLOW}💡 To destroy resources when done:${NC}"
echo -e "${NC}   cd terraform"
echo -e "   terraform destroy"
echo ""
