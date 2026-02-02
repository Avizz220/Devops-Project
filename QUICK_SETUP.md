# 🎯 Quick Setup Checklist

## ✅ WHAT YOU MUST DO (One-time):

### 1. JENKINS SETUP (5 minutes)

**Install Terraform on Jenkins Server:**
```bash
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version
```

**Add Jenkins Credentials:**
```
Jenkins → Manage Jenkins → Credentials → Add

1. Docker Hub:
   - ID: docker-hub-credentials
   - Username: avishka2002
   - Password: [your docker hub token]

2. AWS Access Key:
   - ID: aws-access-key-id
   - Secret: [your AWS access key]

3. AWS Secret Key:
   - ID: aws-secret-access-key
   - Secret: [your AWS secret key]
```

---

### 2. GITHUB SECRETS (2 minutes)

```
GitHub Repo → Settings → Secrets → Actions → New

Add these 4 secrets:
1. DOCKERHUB_USERNAME = avishka2002
2. DOCKERHUB_TOKEN = [your token]
3. AWS_ACCESS_KEY_ID = [your key]
4. AWS_SECRET_ACCESS_KEY = [your secret]
```

**Get Docker Hub Token:**
- https://hub.docker.com/settings/security
- Create new token
- Copy and add to GitHub

---

### 3. PUSH TO GITHUB (30 seconds)

```bash
git add .
git commit -m "feat: Add full automation pipeline"
git push origin main
```

---

## 🚀 THAT'S IT! NOW AUTOMATIC:

```
Any code commit → Auto build → Auto push → Auto deploy to AWS
```

---

## 📱 MONITOR YOUR DEPLOYMENT:

**Jenkins:** `http://your-jenkins-url`  
**GitHub Actions:** Repository → Actions tab  
**AWS:** Check EC2 console  
**App:** Get URL from Terraform output

---

## 🧪 TEST IT NOW:

```bash
# Make a test change
echo "// automation test" >> src/App.jsx

# Commit and watch magic happen
git add .
git commit -m "test: automation"
git push origin main
```

**Then watch:**
- Jenkins starts building automatically
- Docker images get pushed
- AWS infrastructure updates
- App goes live with changes

---

## ⚠️ TROUBLESHOOTING:

**Pipeline fails?**
- Check credentials are correct
- Verify Terraform is installed on Jenkins
- Check AWS credentials have proper permissions

**Need help?**
- See full guide: [AUTOMATION_SETUP.md](AUTOMATION_SETUP.md)
- Run verification: `bash verify-setup.sh`

---

## 🎉 YOU'RE DONE!

From now on, just code and commit. Everything else is automatic! 🚀
