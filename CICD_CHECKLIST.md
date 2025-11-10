# ✅ CI/CD Setup Checklist

Use this checklist to ensure you complete all steps correctly.

## 🎯 Pre-Setup Requirements
- [ ] GitHub account with repository access
- [ ] Docker Hub account created
- [ ] Git installed on your machine
- [ ] Repository already pushed to GitHub

---

## 📋 Setup Steps

### Part 1: Docker Hub Configuration
- [ ] **1.1** Log in to Docker Hub (https://hub.docker.com)
- [ ] **1.2** Go to Account Settings → Security
- [ ] **1.3** Create new access token named `github-actions-ci-cd`
- [ ] **1.4** Copy and save the token (you'll need it for GitHub)
- [ ] **1.5** (Optional) Create repositories: `community-events-frontend` and `community-events-backend`

### Part 2: GitHub Secrets Configuration
- [ ] **2.1** Go to GitHub repository: https://github.com/Avizz220/Devops-Project
- [ ] **2.2** Click Settings → Secrets and variables → Actions
- [ ] **2.3** Add secret: `DOCKERHUB_USERNAME` = your Docker Hub username
- [ ] **2.4** Add secret: `DOCKERHUB_TOKEN` = your Docker Hub access token
- [ ] **2.5** Verify both secrets are saved

### Part 3: Push Workflow to GitHub
- [ ] **3.1** Files are already created in `.github/workflows/`
- [ ] **3.2** Run these commands:

```bash
cd /home/avishka/Devops_project/Devops_Project
git add .github/workflows/docker-build-push.yml
git add docker-compose.hub.yml deploy-from-hub.sh deploy-from-hub.bat .env.example
git commit -m "Add CI/CD workflow for Docker Hub automation"
git push origin main
```

### Part 4: Verify Automation
- [ ] **4.1** Go to GitHub → Actions tab
- [ ] **4.2** See workflow running "Build and Push Docker Images to Docker Hub"
- [ ] **4.3** Wait for green checkmark ✅ (takes 5-10 minutes)
- [ ] **4.4** Check Docker Hub repositories for new images

### Part 5: Test the Automation
- [ ] **5.1** Make a small code change (e.g., edit README.md)
- [ ] **5.2** Commit and push to GitHub
- [ ] **5.3** Watch GitHub Actions trigger automatically
- [ ] **5.4** Verify new images on Docker Hub

### Part 6: Deploy from Docker Hub
- [ ] **6.1** Copy `.env.example` to `.env`
- [ ] **6.2** Update `DOCKERHUB_USERNAME` in `.env` file
- [ ] **6.3** Run deployment script:
  - Windows: `deploy-from-hub.bat your-username latest`
  - Linux/Mac: `./deploy-from-hub.sh your-username latest`
- [ ] **6.4** Verify services running: http://localhost

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ GitHub Actions shows green checkmark after push
- ✅ Docker Hub shows new images with `latest` tag
- ✅ Images have timestamp showing recent build
- ✅ You can pull and run images from Docker Hub
- ✅ Every code push triggers automatic builds

---

## 🔍 What to Verify

### On GitHub
```
Actions tab → Should see workflow runs
Each run should have:
  ✅ Build and Push Frontend Image
  ✅ Build and Push Backend Image
```

### On Docker Hub
```
Repositories → Should see:
  ✅ yourusername/community-events-frontend
  ✅ yourusername/community-events-backend
  
Each repository should have tags:
  ✅ latest
  ✅ main
  ✅ main-<commit-sha>
```

---

## 🎯 Next Time You Make Changes

1. Edit your code
2. Commit changes: `git commit -m "Your message"`
3. Push to GitHub: `git push origin main`
4. GitHub Actions automatically builds and pushes to Docker Hub
5. Pull latest images anywhere: `docker pull yourusername/image:latest`

**That's it! Fully automated!** 🚀

---

## ⏱️ Expected Timeline

- Docker Hub setup: 5 minutes
- GitHub secrets setup: 2 minutes
- Push workflow: 1 minute
- First build completion: 5-10 minutes
- **Total: ~15-20 minutes**

---

## 📝 Important Notes

⚠️ **Docker Hub Token**: Keep it secret, never commit to Git
⚠️ **GitHub Secrets**: Double-check spelling of secret names
⚠️ **First Build**: Takes longer; subsequent builds are faster (cached)
⚠️ **Free Tier**: Docker Hub free tier has pull limits (check usage)

---

**Ready to start? Begin with Part 1! 🚀**
