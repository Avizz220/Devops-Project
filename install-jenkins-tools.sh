#!/bin/bash
# Installation script for Jenkins server dependencies
# Run this on your Jenkins server (where Jenkins agent runs)

set -e

echo "========================================="
echo "Installing Jenkins Dependencies"
echo "========================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Install jq (JSON processor)
echo ""
echo "1. Installing jq..."
if command -v jq &> /dev/null; then
    echo "   ✅ jq already installed: $(jq --version)"
else
    case $OS in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y jq
            ;;
        amzn|rhel|centos|fedora)
            sudo yum install -y jq
            ;;
        *)
            echo "   ⚠️  Unknown OS. Please install jq manually"
            ;;
    esac
    echo "   ✅ jq installed: $(jq --version)"
fi

# Install unzip (needed for Terraform)
echo ""
echo "2. Installing unzip..."
if command -v unzip &> /dev/null; then
    echo "   ✅ unzip already installed"
else
    case $OS in
        ubuntu|debian)
            sudo apt-get install -y unzip
            ;;
        amzn|rhel|centos|fedora)
            sudo yum install -y unzip
            ;;
    esac
    echo "   ✅ unzip installed"
fi

# Install Terraform
echo ""
echo "3. Installing Terraform..."
if command -v terraform &> /dev/null; then
    echo "   ✅ Terraform already installed: $(terraform version | head -1)"
else
    TERRAFORM_VERSION="1.5.0"
    echo "   Downloading Terraform ${TERRAFORM_VERSION}..."
    wget -q https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
    
    echo "   Extracting..."
    unzip -q terraform_${TERRAFORM_VERSION}_linux_amd64.zip
    
    echo "   Installing to /usr/local/bin..."
    sudo mv terraform /usr/local/bin/
    sudo chmod +x /usr/local/bin/terraform
    
    echo "   Cleaning up..."
    rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip
    
    echo "   ✅ Terraform installed: $(terraform version | head -1)"
fi

# Verify installations
echo ""
echo "========================================="
echo "Verification"
echo "========================================="

echo "✅ jq:        $(which jq) - $(jq --version)"
echo "✅ unzip:     $(which unzip) - $(unzip -v | head -1)"
echo "✅ terraform: $(which terraform)"
terraform version

echo ""
echo "========================================="
echo "✅ All dependencies installed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Restart Jenkins: sudo systemctl restart jenkins"
echo "2. Run your pipeline again"
echo ""
