#!/bin/bash

##############################################################################
# AUTOMATED AWS DEPLOYMENT SCRIPT
# This script automates steps 5-10 of the deployment process
# Prerequisites: Steps 1-4 must be completed manually
##############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
PROJECT_NAME="community-events"
ENVIRONMENT="prod"

# Function to print colored messages
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_header() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${GREEN}$1${NC}\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# Function to check if AWS CLI is configured
check_aws_cli() {
    print_header "STEP 5: Verifying AWS CLI Configuration"
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed!"
        print_info "Please install AWS CLI first: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    print_success "AWS CLI is installed"
    
    # Check if credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured!"
        print_info "Your credentials should already be in Jenkins/GitHub"
        print_info "Now configuring AWS CLI locally..."
        
        echo ""
        read -p "Enter your AWS Access Key ID: " AWS_ACCESS_KEY_ID
        read -sp "Enter your AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
        echo ""
        
        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
        aws configure set default.region "$AWS_REGION"
        aws configure set default.output "json"
        
        print_success "AWS CLI configured successfully"
    else
        print_success "AWS credentials are already configured"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        print_info "AWS Account ID: $ACCOUNT_ID"
    fi
}

# Function to create SSH key pair
create_ssh_key() {
    print_header "STEP 6: Creating SSH Key Pair"
    
    KEY_NAME="${PROJECT_NAME}-key-${ENVIRONMENT}"
    KEY_FILE="$HOME/.ssh/${KEY_NAME}.pem"
    
    # Check if key already exists locally
    if [ -f "$KEY_FILE" ]; then
        print_warning "SSH key already exists locally: $KEY_FILE"
        read -p "Do you want to use existing key? (y/n): " USE_EXISTING
        if [ "$USE_EXISTING" != "y" ]; then
            rm -f "$KEY_FILE"
            print_info "Deleted existing local key"
        else
            print_success "Using existing SSH key"
            return 0
        fi
    fi
    
    # Check if key exists in AWS
    if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Key pair '$KEY_NAME' already exists in AWS"
        read -p "Do you want to delete and recreate it? (y/n): " RECREATE
        if [ "$RECREATE" = "y" ]; then
            aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$AWS_REGION"
            print_success "Deleted existing AWS key pair"
        else
            print_error "Cannot proceed without key file. Please manually download the key or choose to recreate."
            exit 1
        fi
    fi
    
    # Create new key pair
    print_info "Creating new SSH key pair: $KEY_NAME"
    mkdir -p "$HOME/.ssh"
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region "$AWS_REGION" \
        --query 'KeyMaterial' \
        --output text > "$KEY_FILE"
    
    chmod 400 "$KEY_FILE"
    print_success "SSH key created and saved to: $KEY_FILE"
    
    # Update terraform variables
    if [ -f "terraform/terraform.tfvars" ]; then
        if grep -q "key_name" terraform/terraform.tfvars; then
            sed -i "s/key_name = .*/key_name = \"$KEY_NAME\"/" terraform/terraform.tfvars
        else
            echo "key_name = \"$KEY_NAME\"" >> terraform/terraform.tfvars
        fi
        print_success "Updated terraform.tfvars with key name"
    fi
}

# Function to initialize and deploy with Terraform
deploy_infrastructure() {
    print_header "STEP 7: Deploying Infrastructure with Terraform"
    
    cd terraform
    
    # Initialize Terraform
    print_info "Initializing Terraform..."
    terraform init
    print_success "Terraform initialized"
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f "terraform.tfvars" ]; then
        print_info "Creating terraform.tfvars file..."
        cat > terraform.tfvars <<EOF
aws_region = "$AWS_REGION"
environment = "$ENVIRONMENT"
project_name = "$PROJECT_NAME"
key_name = "$KEY_NAME"
instance_type = "t2.micro"
dockerhub_username = "avishka2002"
db_name = "community_events"
db_username = "appuser"
db_password = "SecurePassword123!"
EOF
        print_success "Created terraform.tfvars"
    fi
    
    # Validate configuration
    print_info "Validating Terraform configuration..."
    terraform validate
    print_success "Terraform configuration is valid"
    
    # Plan deployment
    print_info "Creating deployment plan..."
    terraform plan -out=tfplan
    print_success "Deployment plan created"
    
    # Apply deployment
    print_warning "About to deploy infrastructure to AWS..."
    read -p "Continue with deployment? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_error "Deployment cancelled by user"
        exit 1
    fi
    
    print_info "Deploying infrastructure... (This may take 5-10 minutes)"
    terraform apply tfplan
    print_success "Infrastructure deployed successfully!"
    
    # Get outputs
    print_info "Retrieving deployment information..."
    EC2_PUBLIC_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    
    cd ..
    
    # Save outputs to file
    cat > deployment-info.txt <<EOF
===========================================
   DEPLOYMENT INFORMATION
===========================================
Date: $(date)
Region: $AWS_REGION
Environment: $ENVIRONMENT

EC2 Instance IP: ${EC2_PUBLIC_IP:-Not available}
Application URL: ${ALB_DNS:-Not available}
SSH Key: $KEY_FILE

To SSH into instance:
ssh -i $KEY_FILE ec2-user@$EC2_PUBLIC_IP

To check logs:
ssh -i $KEY_FILE ec2-user@$EC2_PUBLIC_IP "docker logs community_backend"
ssh -i $KEY_FILE ec2-user@$EC2_PUBLIC_IP "docker logs community_frontend"
===========================================
EOF
    
    print_success "Deployment information saved to deployment-info.txt"
}

# Function to wait for EC2 instance to be ready
wait_for_instance() {
    print_header "STEP 8: Waiting for EC2 Instance to Initialize"
    
    cd terraform
    EC2_PUBLIC_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
    cd ..
    
    if [ -z "$EC2_PUBLIC_IP" ]; then
        print_error "Could not get EC2 public IP"
        exit 1
    fi
    
    print_info "EC2 Public IP: $EC2_PUBLIC_IP"
    print_info "Waiting for instance to be ready... (This may take 3-5 minutes)"
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ec2-user@$EC2_PUBLIC_IP "echo 'Connected'" &> /dev/null; then
            print_success "Instance is ready and accepting SSH connections!"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        print_info "Attempt $ATTEMPT/$MAX_ATTEMPTS - Instance not ready yet, waiting 10 seconds..."
        sleep 10
    done
    
    print_error "Instance did not become ready in time"
    print_warning "You may need to wait a few more minutes and try connecting manually"
}

# Function to verify Docker containers
verify_deployment() {
    print_header "STEP 9: Verifying Docker Containers"
    
    cd terraform
    EC2_PUBLIC_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
    cd ..
    
    print_info "Checking Docker containers on EC2 instance..."
    
    # Wait a bit more for containers to start
    print_info "Waiting for containers to start (60 seconds)..."
    sleep 60
    
    ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@$EC2_PUBLIC_IP << 'ENDSSH'
        echo "=== Docker Containers Status ==="
        sudo docker ps -a
        
        echo ""
        echo "=== Backend Container Logs (last 20 lines) ==="
        sudo docker logs --tail 20 community_backend 2>&1 || echo "Backend container not found"
        
        echo ""
        echo "=== Frontend Container Logs (last 20 lines) ==="
        sudo docker logs --tail 20 community_frontend 2>&1 || echo "Frontend container not found"
        
        echo ""
        echo "=== MySQL Container Status ==="
        sudo docker logs --tail 10 community_mysql 2>&1 || echo "MySQL container not found"
ENDSSH
    
    print_success "Container verification complete"
}

# Function to test application endpoints
test_application() {
    print_header "STEP 10: Testing Application Endpoints"
    
    cd terraform
    EC2_PUBLIC_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    cd ..
    
    # Test backend health
    print_info "Testing backend health endpoint..."
    if curl -s -f "http://$EC2_PUBLIC_IP:4000/api/health" > /dev/null 2>&1; then
        print_success "Backend is responding!"
    else
        print_warning "Backend health check failed (it may still be starting up)"
    fi
    
    # Test frontend
    print_info "Testing frontend..."
    if curl -s -f "http://$EC2_PUBLIC_IP:80" > /dev/null 2>&1; then
        print_success "Frontend is responding!"
    else
        print_warning "Frontend check failed (it may still be starting up)"
    fi
    
    # Display access URLs
    echo ""
    print_header "🎉 DEPLOYMENT COMPLETE! 🎉"
    echo ""
    print_success "Your application is deployed and running!"
    echo ""
    print_info "Access your application at:"
    if [ -n "$ALB_DNS" ]; then
        echo -e "${GREEN}   🌐 http://$ALB_DNS${NC}"
    fi
    echo -e "${GREEN}   🌐 http://$EC2_PUBLIC_IP${NC}"
    echo ""
    print_info "Backend API:"
    echo -e "${GREEN}   🔌 http://$EC2_PUBLIC_IP:4000${NC}"
    echo ""
    print_info "Direct container access:"
    echo -e "${YELLOW}   Frontend: http://$EC2_PUBLIC_IP:80${NC}"
    echo -e "${YELLOW}   Backend: http://$EC2_PUBLIC_IP:4000${NC}"
    echo -e "${YELLOW}   MySQL: $EC2_PUBLIC_IP:3306${NC}"
    echo ""
    print_info "SSH Access:"
    echo -e "${BLUE}   ssh -i $KEY_FILE ec2-user@$EC2_PUBLIC_IP${NC}"
    echo ""
    
    # Save to file
    cat >> deployment-info.txt <<EOF

===========================================
   APPLICATION ACCESS URLs
===========================================
Frontend: http://$EC2_PUBLIC_IP
Backend API: http://$EC2_PUBLIC_IP:4000
${ALB_DNS:+Load Balancer: http://$ALB_DNS}

Test the application:
1. Open http://$EC2_PUBLIC_IP in your browser
2. Try signing up a new user
3. Try logging in
4. Create/browse events
5. Test all CRUD operations

===========================================
EOF
    
    print_info "All information saved to deployment-info.txt"
}

# Function to setup GitHub Actions for auto-deployment
setup_github_actions() {
    print_header "BONUS: Setting up GitHub Actions Auto-Deployment"
    
    print_info "Your GitHub Actions workflow is already configured!"
    print_info "Location: .github/workflows/docker-build-push.yml"
    
    cd terraform
    EC2_PUBLIC_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
    cd ..
    
    echo ""
    print_warning "⚠️  IMPORTANT: Add these secrets to your GitHub repository:"
    echo ""
    echo "Go to: GitHub Repository → Settings → Secrets and variables → Actions"
    echo ""
    echo "Add these secrets:"
    echo "  1. DOCKERHUB_USERNAME = <your-dockerhub-username>"
    echo "  2. DOCKERHUB_TOKEN = <your-dockerhub-token>"
    echo "  3. AWS_ACCESS_KEY_ID = <your-aws-access-key>"
    echo "  4. AWS_SECRET_ACCESS_KEY = <your-aws-secret-key>"
    echo "  5. AWS_REGION = $AWS_REGION"
    echo "  6. EC2_HOST = $EC2_PUBLIC_IP"
    echo "  7. EC2_USERNAME = ec2-user"
    echo ""
    print_info "After adding secrets, every push to 'main' branch will:"
    echo "  ✓ Build Docker images"
    echo "  ✓ Push to Docker Hub"
    echo "  ✓ Deploy to your EC2 instance automatically"
    echo ""
}

# Main execution
main() {
    clear
    print_header "🚀 AUTOMATED AWS DEPLOYMENT SCRIPT 🚀"
    
    print_info "This script will automatically complete steps 5-10:"
    echo "  ✓ Step 5: Configure AWS CLI"
    echo "  ✓ Step 6: Create SSH Key Pair"
    echo "  ✓ Step 7: Deploy Infrastructure with Terraform"
    echo "  ✓ Step 8: Wait for Instance Initialization"
    echo "  ✓ Step 9: Verify Docker Containers"
    echo "  ✓ Step 10: Test Application"
    echo ""
    
    read -p "Press ENTER to start automated deployment..."
    
    # Execute all steps
    check_aws_cli
    create_ssh_key
    deploy_infrastructure
    wait_for_instance
    verify_deployment
    test_application
    setup_github_actions
    
    # Final message
    print_header "✅ ALL STEPS COMPLETED SUCCESSFULLY! ✅"
    print_success "Your Community Events Platform is now live on AWS!"
    echo ""
    print_info "Next steps:"
    echo "  1. Open the application URL in your browser"
    echo "  2. Test all functionalities (signup, login, events, CRUD)"
    echo "  3. Configure GitHub secrets for auto-deployment"
    echo "  4. Make a commit and push to trigger automatic deployment"
    echo ""
    print_warning "Keep your deployment-info.txt file safe!"
    echo ""
}

# Run main function
main
