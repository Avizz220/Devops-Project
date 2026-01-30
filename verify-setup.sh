#!/bin/bash
# Quick Setup Verification Script
# Run this to verify your automation setup

echo "========================================="
echo "🔍 Automation Setup Verification"
echo "========================================="
echo ""

# Check Terraform installation
echo "1️⃣ Checking Terraform..."
if command -v terraform &> /dev/null; then
    echo "   ✅ Terraform is installed"
    terraform --version | head -n 1
else
    echo "   ❌ Terraform is NOT installed"
    echo "   Install with: sudo apt install terraform"
fi
echo ""

# Check Docker installation
echo "2️⃣ Checking Docker..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed"
    docker --version
else
    echo "   ❌ Docker is NOT installed"
fi
echo ""

# Check AWS CLI
echo "3️⃣ Checking AWS CLI..."
if command -v aws &> /dev/null; then
    echo "   ✅ AWS CLI is installed"
    aws --version
    echo "   Current AWS identity:"
    aws sts get-caller-identity 2>/dev/null || echo "   ⚠️  AWS credentials not configured"
else
    echo "   ❌ AWS CLI is NOT installed"
fi
echo ""

# Check Git
echo "4️⃣ Checking Git..."
if command -v git &> /dev/null; then
    echo "   ✅ Git is installed"
    git --version
else
    echo "   ❌ Git is NOT installed"
fi
echo ""

# Check if in terraform directory
echo "5️⃣ Checking Terraform configuration..."
if [ -d "terraform" ]; then
    cd terraform
    echo "   ✅ Terraform directory exists"
    
    if [ -f "main.tf" ]; then
        echo "   ✅ main.tf found"
    else
        echo "   ❌ main.tf not found"
    fi
    
    if [ -f "variables.tf" ]; then
        echo "   ✅ variables.tf found"
    else
        echo "   ❌ variables.tf not found"
    fi
    
    # Check Terraform initialization
    if [ -d ".terraform" ]; then
        echo "   ✅ Terraform initialized"
    else
        echo "   ⚠️  Terraform not initialized. Run: terraform init"
    fi
    cd ..
else
    echo "   ❌ Terraform directory not found"
fi
echo ""

# Check Docker Hub images
echo "6️⃣ Checking Docker Hub images..."
echo "   Frontend: docker pull avishka2002/community-events-frontend:latest"
echo "   Backend: docker pull avishka2002/community-events-backend:latest"
echo ""

# Check Jenkinsfile
echo "7️⃣ Checking Jenkinsfile..."
if [ -f "Jenkinsfile" ]; then
    echo "   ✅ Jenkinsfile exists"
    if grep -q "Terraform" Jenkinsfile; then
        echo "   ✅ Terraform stages found in Jenkinsfile"
    else
        echo "   ⚠️  Terraform stages not found in Jenkinsfile"
    fi
else
    echo "   ❌ Jenkinsfile not found"
fi
echo ""

# Check GitHub Actions
echo "8️⃣ Checking GitHub Actions..."
if [ -f ".github/workflows/docker-build-push.yml" ]; then
    echo "   ✅ GitHub Actions workflow exists"
    if grep -q "terraform" .github/workflows/docker-build-push.yml; then
        echo "   ✅ Terraform deployment configured in GitHub Actions"
    else
        echo "   ⚠️  Terraform deployment not found in workflow"
    fi
else
    echo "   ❌ GitHub Actions workflow not found"
fi
echo ""

echo "========================================="
echo "📋 Setup Status Summary"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If any ❌ appears, install the missing tool"
echo "2. Configure AWS credentials: aws configure"
echo "3. Set up Jenkins credentials (see AUTOMATION_SETUP.md)"
echo "4. Set up GitHub secrets (see AUTOMATION_SETUP.md)"
echo "5. Test deployment: git commit & push"
echo ""
echo "For detailed setup instructions, see: AUTOMATION_SETUP.md"
echo "========================================="
