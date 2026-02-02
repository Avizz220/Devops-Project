# 🚀 Full Automation Setup Guide

## ✅ WHAT I'VE AUTOMATED FOR YOU:

Your pipeline is now **FULLY AUTOMATIC**! Every code commit triggers the entire deployment process.

---

## 📊 AUTOMATED WORKFLOW:

```
YOU COMMIT CODE TO GITHUB
         ↓
AUTOMATIC: Jenkins/GitHub Actions detects change
         ↓
AUTOMATIC: Builds Docker images (Frontend + Backend)
         ↓
AUTOMATIC: Pushes images to Docker Hub
         ↓
AUTOMATIC: Terraform provisions/updates AWS infrastructure
         ↓
AUTOMATIC: EC2 instances pull latest images from Docker Hub
         ↓
✅ YOUR APP IS LIVE & UPDATED!
```

---

## ⚙️ WHAT YOU NEED TO DO (One-time Setup):

### 1️⃣ JENKINS CREDENTIALS SETUP

Open Jenkins → Manage Jenkins → Credentials → Add Credentials

#### Add these credentials:

**A. Docker Hub Credentials:**
- **Kind**: Username with password
- **ID**: `docker-hub-credentials`
- **Username**: `avishka2002`
- **Password**: Your Docker Hub token/password

**B. AWS Access Key ID:**
- **Kind**: Secret text
- **ID**: `aws-access-key-id`
- **Secret**: Your AWS Access Key ID

**C. AWS Secret Access Key:**
- **Kind**: Secret text
- **ID**: `aws-secret-access-key`
- **Secret**: Your AWS Secret Access Key

---

### 2️⃣ GITHUB SECRETS SETUP (For GitHub Actions)

Go to: Your GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

#### Add these secrets:

| Secret Name | Value |
|------------|-------|
| `DOCKERHUB_USERNAME` | `avishka2002` |
| `DOCKERHUB_TOKEN` | Your Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |

**How to get Docker Hub Token:**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token and add to GitHub secrets

---

### 3️⃣ INSTALL TERRAFORM ON JENKINS SERVER

Run these commands on your Jenkins server:

```bash
# Download Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip

# Unzip
unzip terraform_1.5.0_linux_amd64.zip

# Move to system path
sudo mv terraform /usr/local/bin/

# Verify installation
terraform --version
```

---

### 4️⃣ INSTALL REQUIRED JENKINS PLUGINS

Go to: Manage Jenkins → Plugin Manager → Available Plugins

Install these plugins:
- ✅ Pipeline
- ✅ Docker Pipeline
- ✅ AWS Credentials Plugin
- ✅ Git plugin
- ✅ Credentials Binding Plugin

Then restart Jenkins: `sudo systemctl restart jenkins`

---

### 5️⃣ CONFIGURE JENKINS PIPELINE

1. Open Jenkins → New Item
2. Enter name: `Community-Events-Deploy`
3. Select: **Pipeline**
4. Click OK
5. Under "Pipeline" section:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your GitHub repo URL
   - **Branch**: `*/main`
   - **Script Path**: `Jenkinsfile`
6. Click **Save**

---

## 🧪 TESTING THE AUTOMATION:

### Test 1: Small Code Change
```bash
# Make a small change to any file
echo "// Test change" >> src/App.jsx

# Commit and push
git add .
git commit -m "Test: Trigger automatic deployment"
git push origin main
```

**What happens next:**
1. Jenkins/GitHub Actions will automatically trigger
2. Docker images will be built and pushed
3. Terraform will update AWS infrastructure
4. Your app will be deployed with the new changes

**Check progress:**
- Jenkins: http://your-jenkins-url/job/Community-Events-Deploy/
- GitHub: Repository → Actions tab

---

## 📋 WHICH AUTOMATION RUNS WHEN:

### Jenkins (if configured):
- Runs when: Code pushed to GitHub (with webhook)
- Builds: Docker images
- Deploys: Via Terraform to AWS

### GitHub Actions:
- Runs when: Code pushed to `main` or `develop` branch
- Builds: Docker images
- Deploys: Via Terraform to AWS

**Note:** Both can run simultaneously or you can disable one.

---

## 🔍 HOW TO MONITOR DEPLOYMENTS:

### Check Jenkins:
```bash
# Open Jenkins dashboard
# Click on "Community-Events-Deploy"
# See build history and logs
```

### Check GitHub Actions:
```bash
# Go to your repository
# Click "Actions" tab
# See workflow runs
```

### Check AWS Deployment:
```bash
cd terraform
terraform output
```

### Check Docker Hub:
- Visit: https://hub.docker.com/u/avishka2002
- See your latest image tags

---

## 🛠️ TROUBLESHOOTING:

### Pipeline fails at Terraform stage?
**Solution:** Make sure AWS credentials are correctly set in Jenkins/GitHub

### Docker images not pulling on EC2?
**Solution:** Check EC2 user data script and security group settings

### Terraform state conflicts?
**Solution:** Only run one pipeline at a time (Jenkins OR GitHub Actions)

---

## 🎯 CURRENT STATE:

✅ Jenkins builds & pushes Docker images  
✅ GitHub Actions builds & pushes Docker images  
✅ **NEW:** Terraform automatically deploys to AWS after Docker push  
✅ **NEW:** EC2 automatically pulls latest images  
✅ **FULLY AUTOMATIC END-TO-END**

---

## 📝 NEXT STEPS (Optional Enhancements):

1. **Add Slack/Email Notifications**: Get notified when deployment completes
2. **Add Manual Approval Stage**: Review changes before production deploy
3. **Multi-Environment Setup**: Auto-deploy to dev, manual approve for prod
4. **Remote Terraform State**: Store state in S3 for team collaboration
5. **Health Checks**: Automatic rollback if deployment fails

---

## 🆘 NEED HELP?

If something doesn't work:
1. Check Jenkins/GitHub Actions logs
2. Check AWS CloudWatch logs
3. Verify all credentials are correctly configured
4. Make sure Terraform is installed on Jenkins server

---

**🎉 You now have a fully automated CI/CD pipeline!**

Every commit → Automatic build → Automatic deploy → Live on AWS
