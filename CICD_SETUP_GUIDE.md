# 🚀 GitHub to Docker Hub CI/CD Setup Guide

## 📋 Overview
This guide will help you set up automated Docker image builds that trigger whenever you push code to GitHub. Your Docker images will be automatically built and pushed to Docker Hub.

---

## 🎯 Step-by-Step Manual Setup Process

### **STEP 1: Create Docker Hub Account & Repository**

#### 1.1 Create Docker Hub Account (if you don't have one)
- Go to https://hub.docker.com/
- Click "Sign Up"
- Create your account
- Verify your email

#### 1.2 Create Access Token
- Log in to Docker Hub
- Click on your username (top right) → **Account Settings**
- Go to **Security** tab
- Click **New Access Token**
- Token description: `github-actions-ci-cd`
- Access permissions: **Read, Write, Delete**
- Click **Generate**
- **⚠️ IMPORTANT**: Copy the token NOW (you won't see it again!)
- Save it somewhere safe temporarily

#### 1.3 Create Docker Hub Repositories (Optional but Recommended)
- Go to https://hub.docker.com/repositories
- Click **Create Repository**
- Repository 1:
  - Name: `community-events-frontend`
  - Visibility: Public (or Private)
  - Click **Create**
- Repository 2:
  - Name: `community-events-backend`
  - Visibility: Public (or Private)
  - Click **Create**

---

### **STEP 2: Configure GitHub Repository Secrets**

#### 2.1 Go to Your GitHub Repository
- Open https://github.com/Avizz220/Devops-Project
- Click **Settings** tab (top right of repository page)

#### 2.2 Add Docker Hub Secrets
- In the left sidebar, click **Secrets and variables** → **Actions**
- Click **New repository secret**

**Secret 1: Docker Hub Username**
- Name: `DOCKERHUB_USERNAME`
- Value: Your Docker Hub username (e.g., `yourusername`)
- Click **Add secret**

**Secret 2: Docker Hub Access Token**
- Click **New repository secret** again
- Name: `DOCKERHUB_TOKEN`
- Value: Paste the access token you copied in Step 1.2
- Click **Add secret**

#### 2.3 Verify Secrets
You should now see two secrets:
- ✅ `DOCKERHUB_USERNAME`
- ✅ `DOCKERHUB_TOKEN`

---

### **STEP 3: Push GitHub Actions Workflow to Repository**

The workflow file has already been created at:
`.github/workflows/docker-build-push.yml`

#### 3.1 Commit and Push the Workflow File

Open your terminal and run:

```bash
# Make sure you're in the project directory
cd /home/avishka/Devops_project/Devops_Project

# Add the workflow file
git add .github/workflows/docker-build-push.yml

# Also add the new deployment files
git add docker-compose.hub.yml
git add deploy-from-hub.sh
git add deploy-from-hub.bat
git add .env.example

# Commit the changes
git commit -m "Add GitHub Actions workflow for automated Docker Hub builds"

# Push to GitHub
git push origin main
```

---

### **STEP 4: Verify GitHub Actions is Running**

#### 4.1 Check Workflow Execution
- Go to your GitHub repository: https://github.com/Avizz220/Devops-Project
- Click the **Actions** tab
- You should see a workflow running called "Build and Push Docker Images to Docker Hub"
- Click on it to see the progress

#### 4.2 Monitor Build Progress
The workflow will:
1. ✅ Checkout your code
2. ✅ Set up Docker Buildx
3. ✅ Log in to Docker Hub
4. ✅ Build Frontend image
5. ✅ Push Frontend image to Docker Hub
6. ✅ Build Backend image
7. ✅ Push Backend image to Docker Hub

This process takes about 5-10 minutes depending on your code size.

---

### **STEP 5: Verify Images on Docker Hub**

#### 5.1 Check Your Docker Hub Repositories
- Go to https://hub.docker.com/repositories
- You should see:
  - `yourusername/community-events-frontend` with tag `latest`
  - `yourusername/community-events-backend` with tag `latest`

#### 5.2 Check Image Tags
Each image will have multiple tags:
- `latest` - Latest build from main branch
- `main` - Branch-based tag
- `main-<commit-sha>` - Specific commit tag

---

### **STEP 6: Test Automated Builds**

#### 6.1 Make a Small Code Change
Let's test the automation by making a small change:

```bash
# Edit a file (for example, add a comment to README.md)
echo "# Testing automated Docker builds" >> README.md

# Commit the change
git add README.md
git commit -m "Test automated Docker build trigger"

# Push to GitHub
git push origin main
```

#### 6.2 Watch GitHub Actions
- Go to GitHub → Actions tab
- You should see a new workflow run starting automatically
- Wait for it to complete (green checkmark ✅)

#### 6.3 Check Docker Hub
- Go to Docker Hub and check your repositories
- You should see new image builds with updated timestamps

---

### **STEP 7: Deploy Using Docker Hub Images**

Now you can deploy your application from anywhere using the Docker Hub images!

#### 7.1 Create Environment File
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your Docker Hub username
nano .env  # or use any text editor
```

Update the content:
```
DOCKERHUB_USERNAME=your-actual-dockerhub-username
IMAGE_TAG=latest
```

#### 7.2 Deploy Using the Script

**On Linux/Mac:**
```bash
chmod +x deploy-from-hub.sh
./deploy-from-hub.sh your-dockerhub-username latest
```

**On Windows:**
```cmd
deploy-from-hub.bat your-dockerhub-username latest
```

**Or using Docker Compose directly:**
```bash
DOCKERHUB_USERNAME=your-dockerhub-username IMAGE_TAG=latest docker-compose -f docker-compose.hub.yml up -d
```

---

## 🔄 How the Automation Works

### Trigger Events
The workflow automatically runs when:
1. ✅ You push code to `main` branch
2. ✅ You push code to `develop` branch
3. ✅ You create a pull request to `main`
4. ✅ You manually trigger it from GitHub Actions tab

### What Happens Automatically
1. GitHub detects your code push
2. GitHub Actions starts the workflow
3. Code is checked out
4. Docker images are built for frontend and backend
5. Images are tagged with multiple tags (latest, branch name, commit SHA)
6. Images are pushed to Docker Hub
7. You get a notification (green ✅ or red ❌)

### Image Tags Created
- `latest` - Always points to the latest main branch build
- `main` or `develop` - Branch-specific tags
- `main-abc123` - Commit-specific tags for rollback

---

## 🎯 Benefits of This Setup

✅ **Automated Builds**: No manual docker build commands needed
✅ **Version Control**: Every commit gets its own Docker image
✅ **Easy Rollback**: Use commit-specific tags to rollback
✅ **Consistent Builds**: Same build process every time
✅ **Fast Deployment**: Pull pre-built images instead of building locally
✅ **Team Collaboration**: Everyone uses the same images

---

## 🔧 Customization Options

### Change Image Names
Edit `.github/workflows/docker-build-push.yml`:
```yaml
images: ${{ secrets.DOCKERHUB_USERNAME }}/your-custom-name
```

### Add More Branches
Edit the workflow file:
```yaml
on:
  push:
    branches:
      - main
      - develop
      - staging  # Add more branches
```

### Change Trigger Behavior
Skip builds for documentation changes (already configured):
```yaml
paths-ignore:
  - '**.md'
  - 'LICENSE'
```

---

## 🐛 Troubleshooting

### Build Fails on GitHub Actions
- Check the Actions tab for error logs
- Common issues:
  - Docker Hub credentials incorrect
  - Dockerfile syntax errors
  - Missing dependencies in package.json

### Images Not Appearing on Docker Hub
- Verify Docker Hub secrets in GitHub
- Check workflow completed successfully (green ✅)
- Refresh Docker Hub page

### Cannot Pull Images
- Make sure repository is public or you're logged in
- Use correct image name: `username/repository:tag`
- Run: `docker login` first

---

## 📝 Quick Reference Commands

### Pull Latest Images
```bash
docker pull yourusername/community-events-frontend:latest
docker pull yourusername/community-events-backend:latest
```

### View GitHub Actions Logs
```bash
# Go to: https://github.com/Avizz220/Devops-Project/actions
```

### Manual Workflow Trigger
```bash
# Go to: Actions tab → Select workflow → Run workflow button
```

### Check Running Containers
```bash
docker-compose -f docker-compose.hub.yml ps
```

### View Container Logs
```bash
docker-compose -f docker-compose.hub.yml logs -f frontend
docker-compose -f docker-compose.hub.yml logs -f backend
```

---

## 🎉 Next Steps

1. ✅ Complete Steps 1-3 (Docker Hub setup and GitHub secrets)
2. ✅ Push the workflow file to GitHub
3. ✅ Watch your first automated build
4. ✅ Test by making a code change
5. ✅ Deploy using Docker Hub images

---

## 📞 Need Help?

If you encounter any issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify Docker Hub credentials
3. Ensure Dockerfile syntax is correct
4. Make sure all secrets are properly configured

---

**🎯 You're now ready for automated CI/CD with Docker Hub!**
