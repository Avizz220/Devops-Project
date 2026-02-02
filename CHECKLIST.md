# ✅ NEW AWS ACCOUNT - QUICK CHECKLIST

## 🎯 DO THESE 5 THINGS BEFORE RUNNING DEPLOYMENT

### ☐ 1. CREATE AWS ACCESS KEYS (5 minutes)
```
📍 Where: https://console.aws.amazon.com/
👤 Login to your NEW AWS account
🔑 Top right → Your Name → Security Credentials
📋 Create access key → CLI → Create
💾 SAVE BOTH:
   - Access Key ID (starts with AKIA...)
   - Secret Access Key (shown only once!)
```

### ☐ 2. CREATE EC2 KEY PAIR (3 minutes)
```
📍 Where: https://console.aws.amazon.com/ec2/
🌍 Region: Change to us-west-2 (top right)
🔑 Left menu → Key Pairs → Create key pair
📝 Settings:
   Name: community-events-key
   Type: RSA
   Format: .pem (Linux/Mac) or .ppk (Windows)
💾 DOWNLOAD THE FILE - Can't get it again!
```

### ☐ 3. UPDATE JENKINS (3 minutes)
```
📍 Where: http://your-jenkins:8080
🔧 Manage Jenkins → Credentials → System → Global

Update these 3:
✏️ aws-access-key-id = [Your NEW Access Key ID]
✏️ aws-secret-access-key = [Your NEW Secret Access Key]
✏️ docker-hub-credentials = avishka2002 / [Your Docker token]

Need Docker token? https://hub.docker.com/settings/security
```

### ☐ 4. UPDATE GITHUB SECRETS (3 minutes)
```
📍 Where: GitHub → Your Repo → Settings → Secrets → Actions

Update these 4:
✏️ AWS_ACCESS_KEY_ID = [Your NEW Access Key ID]
✏️ AWS_SECRET_ACCESS_KEY = [Your NEW Secret Access Key]
✏️ DOCKERHUB_USERNAME = avishka2002
✏️ DOCKERHUB_TOKEN = [Your Docker Hub token]
```

### ☐ 5. CONFIGURE AWS CLI (2 minutes)
```powershell
# In PowerShell or Terminal:
aws configure

Enter:
  Access Key ID: [Your NEW Access Key ID]
  Secret Access Key: [Your NEW Secret Access Key]
  Region: us-west-2
  Format: json

# Verify it works:
aws sts get-caller-identity
```

---

## 🚀 AFTER CHECKLIST IS DONE

### Run Automated Deployment:

**Windows (PowerShell):**
```powershell
.\deploy-new-aws-account.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deploy-new-aws-account.sh
./deploy-new-aws-account.sh
```

**Or tell me:**
> "I've completed the checklist, please deploy now"

---

## ⏱️ TIME ESTIMATE

| Task | Time |
|------|------|
| Manual Steps (1-5) | 15-20 min |
| Automated Deployment | 10-15 min |
| **TOTAL** | **25-35 min** |

---

## 🆘 NEED HELP?

Tell me which step you're stuck on:
- "Help with step 1" (AWS keys)
- "Help with step 2" (EC2 key pair)
- "Help with step 3" (Jenkins)
- "Help with step 4" (GitHub)
- "Help with step 5" (AWS CLI)

Or ask specific questions!

---

## 📌 IMPORTANT REMINDERS

✋ **STOP if:**
- You don't have the NEW AWS account credentials
- You're still using the OLD account
- You haven't created the EC2 key pair

🎯 **VERIFY:**
- All credentials are from the NEW account
- Key pair exists in us-west-2 region
- You can run `aws sts get-caller-identity` successfully

💰 **COST:**
- FREE (within Free Tier limits)
- t2.micro EC2 instance
- No RDS charges

🕐 **DURATION:**
- Infrastructure: 5-10 minutes
- Container startup: 2-3 minutes
- Total: ~15 minutes
