# 🔐 Setup GitHub Secrets for Auto-Deployment

## ✅ CODE PUSHED SUCCESSFULLY!

Your code is now on GitHub. To enable **automatic deployment on every push**, add these 7 secrets:

---

## 📍 Where to Add Secrets

1. Go to: https://github.com/Avizz220/Devops-Project/settings/secrets/actions
2. Click **"New repository secret"** for each one below

---

## 🔑 Secrets to Add

### Secret 1: DOCKERHUB_USERNAME
```
avishka2002
```

### Secret 2: DOCKERHUB_TOKEN
```
your_dockerhub_token_here
```

### Secret 3: AWS_ACCESS_KEY_ID
```
your_aws_access_key_id_here
```

### Secret 4: AWS_SECRET_ACCESS_KEY
```
your_aws_secret_access_key_here
```

### Secret 5: AWS_REGION
```
us-east-1
```

### Secret 6: EC2_HOST
```
13.220.61.29
```

### Secret 7: EC2_SSH_KEY
```
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAtQmM22jTOeYuSxaZs6g6AsGhqEs4cgnSdjZlXWx7KcM4UVdv
8tYianQbFO/aOhhXjPSCArJtu9r3FBpaGcGVIFBwf99jYr/6KPjZI05JemkpzRr5
J2FdMtAemjKejVjZAB3QcNvHDoqMtWbWooVPRL0RTTcmptOnK1klMf4wLF2q59sD
A+TmdBNTZn6Qh1cVkLDJ5j36B4HszkTlv/193Dvpra5GUOq8U5St1a6EqlO9k9uN
5md/YjPEqwqbEXxFIMqdYNbSo4+VYyp77LHL7aywypjhikr3R+n1eR2z8Dcu9bZx
5FocataWod4v/OZTsJr8/6s0y8R87SA/q/AFIwIDAQABAoIBAEzyHTNYb4bJZd22
Ymew1c88G4ibSAd4U0K5RgYaSJLsjbBM+KD/EKusY6JXe6p7lCKt/eBFlExm+eNK
fAc8dzS/28EN4oEjVaE6e5f8+1ATCJhLoaBySpmBSbCCWU98ducMxP5i+00b6Ehl
yE5VWOa/cW4fRcdcaE4NWrjP8Au6oLRiTIS9QRbZSQA2ZSJnGKLjjTExgPe7RBss
A3OXWBcfxWYlrzRmtyuwqPPY0IwaNKuyimz3tr1B1bbNmkertY0mcXVfKfRaUu+T
QH+6mn5Ab8SPAezYRcIoqu6bOlmAOOWv+YUrWcel+4bOvxNSzPgD/kkSHFVLqHMq
Yb8xirkCgYEA5g+s+dp2AkpUCHysSegw73SM5OIrZKgnRGEnt/S/GrbebrHuRh+Q
cyBL1HneiHHIO6PbujEHcCHiAYHf/nRuXhYJ8tpHhNDyB/3FzpLGc0uOdYyGcakS
UeZq0XJvKeD20gmuEsGy2BaUKDB98K/1QzylrQAUZiWj5x76e3B5Kr8CgYEAyXLh
9UhVY6uh5yfYFxmG5Xk/N5EfCPocJ7gZBzwDLRe1nK0ksCcBRWtZDhtve1zB8ddg
TEqumDw0ut/VO1IknofYCCaDi+GOejK5fsF+qG0UpUXSVqAyb9oI4I51xTGEcTJs
bRgmXw4S/3X/Cnt+D7zgKZmgaFPyRIRxEJAYsp0CgYAJ903f+PW5vayMPZJdFUDh
bqQX2jBVCO/Ch47n6iNJLfjOxMh0ozNnuVNvnePk90DcTIndM/iFhAI9XHnulO6f
BsdhjNEiUMbbT8P84eDU58YBE5hTXiacA6ZG8nUcVFF84cx3pYpwz/GVGBysi4LN
adgneWRo1GKYRYBGTqYBEwKBgHmFMcVzIv+DE6GLqZEVtwhKgdYVVvFlXwKezYpN
q2TSPp4K3GzeuqeTwB8Acdmq9NvcnpynGHeBKhXo3IpyXOC89ZbFFOmW4QnZ+4f5
VVxooOGqIt5auNI8Zsp/ZY/U9R4L2thcjxkcNl2gYn+CS2NW/qpZoCgPK8AlXMcv
BZcJAoGAS673P6LgdN+NflBRuGYTtY50VI0UiwkMqGbAkpd628UvYJyFWabaqBda
N6oHYTXii25Qd6axhwU2pfhrwFCsCyhwzHKMXpI/++ssVwziU4CkmGEa9Nc5sCke
lw6Xw2sSzbUnRM5s+b7SJpm4tSzNhmAaD/14dvVuSniaVX+aiZ4=
-----END RSA PRIVATE KEY-----
```

---

## ⚡ After Adding All Secrets

Once you've added all 7 secrets, **automated deployment is complete!**

### What Happens Automatically:
- Every push to `main` branch triggers GitHub Actions
- Builds Docker images for frontend and backend
- Pushes images to Docker Hub
- Deploys to your EC2 instance automatically

---

## 🌐 Access Your Site

**Frontend:** http://13.220.61.29
**Backend API:** http://13.220.61.29:4000

---

## ✨ Test Auto-Deployment

Make a small change, commit and push:
```bash
echo "test" >> README.md
git add README.md
git commit -m "Test auto-deployment"
git push origin main
```

Then watch the magic happen at: https://github.com/Avizz220/Devops-Project/actions

---

**Your site is fully automated! 🎉**
