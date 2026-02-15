# Deployment Setup Instructions

## ✅ What Was Fixed

Your Jenkins pipeline now deploys directly to your **existing server** (35.175.125.161) instead of creating new servers each time.

## 🔑 One-Time Setup Required

You need to add the SSH key to Jenkins **ONCE**:

### Steps:

1. **Open Jenkins Dashboard**
   - Go to your Jenkins URL

2. **Navigate to Credentials**
   - Click: `Manage Jenkins` → `Credentials`
   - Click: `(global)` domain
   - Click: `Add Credentials`

3. **Add SSH Key**
   - **Kind**: Select `SSH Username with private key`
   - **ID**: Type exactly `aws-ec2-ssh-key`
   - **Username**: Type `ubuntu`
   - **Private Key**: Click `Enter directly`
   - Paste your entire `.pem` file content (the SSH key you use to connect to EC2)
   - **Click**: `Create`

4. **Done!** 🎉

## 🚀 How It Works Now

After the one-time setup above:

1. You make code changes
2. Commit and push to GitHub
3. Jenkins automatically:
   - Builds new Docker images
   - Pushes to Docker Hub
   - SSHs into 35.175.125.161
   - Pulls latest images
   - Restarts containers
4. Your changes are live at **http://35.175.125.161** ✅

## 📝 Notes

- The SSH key ID **must be exactly**: `aws-ec2-ssh-key`
- If you don't have the `.pem` file, you can get it from AWS EC2 Key Pairs
- Terraform stages are now disabled (no more new servers created)
- All updates go to the existing production server

## ❓ Need Help?

If the `.pem` file is lost, you can:
1. Connect to the server using AWS Systems Manager Session Manager
2. Add a new SSH public key to `~/.ssh/authorized_keys`
