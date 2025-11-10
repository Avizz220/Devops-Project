#!/bin/bash

# CI/CD Setup Verification Script
# This script helps verify your CI/CD setup is complete

echo "=================================================="
echo "🔍 CI/CD Setup Verification Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .github/workflows exists
echo "1️⃣  Checking GitHub Actions workflow file..."
if [ -f ".github/workflows/docker-build-push.yml" ]; then
    echo -e "${GREEN}✅ Workflow file exists${NC}"
else
    echo -e "${RED}❌ Workflow file missing${NC}"
    echo "   Run: git add .github/workflows/docker-build-push.yml"
fi
echo ""

# Check if docker-compose.hub.yml exists
echo "2️⃣  Checking Docker Compose Hub file..."
if [ -f "docker-compose.hub.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.hub.yml exists${NC}"
else
    echo -e "${RED}❌ docker-compose.hub.yml missing${NC}"
fi
echo ""

# Check if deployment scripts exist
echo "3️⃣  Checking deployment scripts..."
if [ -f "deploy-from-hub.sh" ] && [ -f "deploy-from-hub.bat" ]; then
    echo -e "${GREEN}✅ Deployment scripts exist${NC}"
    chmod +x deploy-from-hub.sh 2>/dev/null
    echo "   Made deploy-from-hub.sh executable"
else
    echo -e "${RED}❌ Deployment scripts missing${NC}"
fi
echo ""

# Check if .env.example exists
echo "4️⃣  Checking .env.example file..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
else
    echo -e "${RED}❌ .env.example missing${NC}"
fi
echo ""

# Check git status
echo "5️⃣  Checking git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Git repository detected${NC}"
    
    # Check if there are uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
        git status -s
    else
        echo -e "${GREEN}✅ Working directory clean${NC}"
    fi
else
    echo -e "${RED}❌ Not a git repository${NC}"
fi
echo ""

# Check if remote is set
echo "6️⃣  Checking GitHub remote..."
if git remote get-url origin > /dev/null 2>&1; then
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✅ GitHub remote configured${NC}"
    echo "   Remote: $REMOTE_URL"
else
    echo -e "${RED}❌ GitHub remote not configured${NC}"
fi
echo ""

# Check current branch
echo "7️⃣  Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${GREEN}✅ On main branch${NC}"
else
    echo -e "${YELLOW}⚠️  Current branch: $CURRENT_BRANCH${NC}"
    echo "   Workflow triggers on 'main' branch"
fi
echo ""

# Summary
echo "=================================================="
echo "📋 NEXT STEPS"
echo "=================================================="
echo ""
echo "If all checks passed, proceed with:"
echo ""
echo "1️⃣  Set up Docker Hub:"
echo "   - Go to https://hub.docker.com"
echo "   - Create access token"
echo "   - Note your username"
echo ""
echo "2️⃣  Configure GitHub Secrets:"
echo "   - Go to https://github.com/Avizz220/Devops-Project/settings/secrets/actions"
echo "   - Add DOCKERHUB_USERNAME"
echo "   - Add DOCKERHUB_TOKEN"
echo ""
echo "3️⃣  Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add CI/CD workflow for Docker Hub'"
echo "   git push origin main"
echo ""
echo "4️⃣  Monitor build:"
echo "   - Go to https://github.com/Avizz220/Devops-Project/actions"
echo "   - Watch the workflow run"
echo ""
echo "=================================================="
echo "📚 For detailed instructions, see:"
echo "   - CICD_SETUP_GUIDE.md"
echo "   - CICD_CHECKLIST.md"
echo "=================================================="
