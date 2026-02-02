# 🚀 Complete Deployment Guide for New AWS Account

## 📋 MANUAL STEPS YOU MUST DO (30 minutes total)

### STEP 1: AWS Account Setup (10 minutes)

#### 1.1 Create New Access Keys in New AWS Account
1. Login to your **new AWS account**: https://console.aws.amazon.com/
2. Click your username (top right) → **Security Credentials**
3. Scroll to **Access keys** section
4. Click **Create access key**
5. Select **Command Line Interface (CLI)**
6. Check the confirmation box
7. Click **Create access key**
8. **⚠️ IMPORTANT**: Download or copy both:
   - **Access Key ID** (starts with AKIA...)
   - **Secret Access Key** (shown only once!)

#### 1.2 Create EC2 Key Pair (for SSH access)
1. Go to **EC2 Dashboard**: https://console.aws.amazon.com/ec2/
2. Change region to **us-west-2** (Oregon) - top right corner
3. Left menu → **Key Pairs** (under Network & Security)
4. Click **Create key pair**
5. Settings:
   - Name: `community-events-key`
   - Key pair type: **RSA**
   - File format: **.pem** (for Linux/Mac) or **.ppk** (for Windows PuTTY)
6. Click **Create key pair**
7. **⚠️ SAVE THE FILE** - you can't download it again!

---

### STEP 2: Update Jenkins Credentials (5 minutes)

1. Open Jenkins: http://your-jenkins-url:8080
2. Go to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials**

#### Update/Add these 3 credentials:

**A. AWS Access Key ID**
- Click existing `aws-access-key-id` (or create new)
- ID: `aws-access-key-id`
- Secret: **[Paste your NEW Access Key ID from Step 1.1]**
- Description: `New AWS Account Access Key ID`
- Click **Save**

**B. AWS Secret Access Key**
- Click existing `aws-secret-access-key` (or create new)
- ID: `aws-secret-access-key`
- Secret: **[Paste your NEW Secret Access Key from Step 1.1]**
- Description: `New AWS Account Secret Key`
- Click **Save**

**C. Docker Hub Credentials** (verify/update)
- Click existing `docker-hub-credentials` (or create new)
- ID: `docker-hub-credentials`
- Username: `avishka2002`
- Password: **[Your Docker Hub access token]**
- Click **Save**

**💡 Need Docker Hub Token?**
- Go to: https://hub.docker.com/settings/security
- Click **New Access Token**
- Name it: `jenkins-deployment`
- Copy the token and use it as password

---

### STEP 3: Update GitHub Secrets (5 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Update these 4 secrets:

#### Click each secret name and update:

**A. AWS_ACCESS_KEY_ID**
- Click **Update**
- Value: **[Your NEW Access Key ID from Step 1.1]**
- Click **Update secret**

**B. AWS_SECRET_ACCESS_KEY**
- Click **Update**
- Value: **[Your NEW Secret Access Key from Step 1.1]**
- Click **Update secret**

**C. DOCKERHUB_USERNAME**
- Verify value: `avishka2002`

**D. DOCKERHUB_TOKEN**
- Update if needed with your Docker Hub token

---

### STEP 4: Configure Local AWS CLI (5 minutes)

Open PowerShell and run:

```powershell
# Install AWS CLI if not installed
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI with new account
aws configure

# When prompted, enter:
# AWS Access Key ID: [Your NEW Access Key ID]
# AWS Secret Access Key: [Your NEW Secret Access Key]
# Default region name: us-west-2
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

Expected output should show your new AWS account number.

---

### STEP 5: Update Terraform Key Name (1 minute)

The key name must match what you created in Step 1.2:

Open file: `terraform/variables.tf`

Find this line (around line 71):
```hcl
variable "key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = "community-events-key"  # ← Make sure this matches your key pair name
}
```

If you named your key differently in Step 1.2, update this value.

---

## 🤖 AUTOMATED DEPLOYMENT (I'll do this for you)

After you complete the manual steps above, I will:

### ✅ What I'll Automate:

1. **Clean up old Terraform state** (from old AWS account)
2. **Initialize Terraform** for new account
3. **Create deployment script** with proper configurations
4. **Deploy infrastructure** to AWS:
   - VPC with public/private subnets
   - Security groups
   - EC2 instance with Docker
   - Application load balancer (if configured)
5. **Deploy application** containers
6. **Verify deployment** and get you the URL
7. **Update CI/CD configurations**

---

## ⏭️ WHAT TO DO NEXT

### Option A: You've Already Done Manual Steps ✅
Tell me: **"I've completed all manual steps, please deploy now"**

### Option B: You Need Help with Manual Steps ❓
Tell me which step you need help with:
- "Help me with Step 1" (AWS setup)
- "Help me with Step 2" (Jenkins)
- "Help me with Step 3" (GitHub)
- etc.

### Option C: You Want to Do It Yourself 🛠️
I can just prepare all files and give you commands to run.
Tell me: **"Just prepare files, I'll deploy manually"**

---

## 📊 Quick Summary

| Step | Task | Time | Your Action |
|------|------|------|-------------|
| 1 | AWS Setup | 10 min | Create keys & key pair |
| 2 | Jenkins Credentials | 5 min | Update 3 credentials |
| 3 | GitHub Secrets | 5 min | Update 4 secrets |
| 4 | AWS CLI Config | 5 min | Run `aws configure` |
| 5 | Verify Terraform vars | 1 min | Check key name |
| **TOTAL** | **Manual Work** | **~30 min** | **You do this** |
| 6-12 | Deployment | 10-15 min | **I automate this** |

---

## 🆘 TROUBLESHOOTING

### If you get "Access Denied" errors:
- Make sure you're using the NEW AWS account credentials
- Verify credentials in Jenkins and GitHub are correct
- Run `aws sts get-caller-identity` to confirm you're using right account

### If key pair not found:
- Make sure key pair exists in **us-west-2** region
- Check the name matches in `terraform/variables.tf`

### If you lost your Secret Access Key:
- You cannot retrieve it again
- Delete the old access key in AWS Console
- Create a new one following Step 1.1

---

## 💡 IMPORTANT NOTES

1. **Never share your credentials** - they give full access to your AWS account
2. **Save your key pair file** - you can't download it again
3. **All AWS resources will be created in us-west-2** (Oregon region)
4. **This stays within Free Tier** limits:
   - t2.micro EC2 instance
   - No RDS (using containerized MySQL instead)
   - Minimal storage
5. **Estimated deployment time**: 10-15 minutes after manual steps done

---

## 🎯 READY TO START?

Confirm you understand the steps and we'll begin! Just tell me:
- **"I'm ready, let's start with Step 1"** (I'll guide you)
- **"I've done Steps 1-5, deploy now"** (I'll automate deployment)
- **"Explain [specific step] more"** (I'll help)
