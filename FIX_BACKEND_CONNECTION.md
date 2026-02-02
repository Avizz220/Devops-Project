# 🔧 FIXING BACKEND CONNECTION ISSUE

## Problem Identified ✅

Your frontend was built with the wrong backend IP (`18.215.189.159`) hardcoded. The correct IP is `13.220.61.29`.

## ✅ What I've Fixed

1. ✅ Updated [src/config.js](src/config.js) - Frontend now uses relative URLs
2. ✅ Updated [nginx.conf](nginx.conf) - Nginx properly proxies `/api/` to backend
3. ✅ Rebuilt frontend Docker image with fixes
4. ✅ Pushed updated image to Docker Hub

## 🚀 How to Deploy the Fix

### Option 1: Manual Update via AWS EC2 Instance Connect (RECOMMENDED - No SSH Key Needed)

1. **Go to AWS Console**:
   - Navigate to: https://console.aws.amazon.com/ec2
   - **IMPORTANT**: Change region to **us-east-1 (N. Virginia)** (you were looking at Oregon!)
   
2. **Connect to Instance**:
   - Find instance: `i-064119cb154739571` (IP: 13.220.61.29)
   - Click "Connect" button
   - Select "EC2 Instance Connect"
   - Click "Connect"

3. **Run These Commands** (copy-paste one by one):

```bash
# Pull latest frontend image
sudo docker pull avishka2002/community-events-frontend:latest

# Stop old frontend container
sudo docker stop community_frontend
sudo docker rm community_frontend

# Start new frontend container
sudo docker run -d \
  --name community_frontend \
  --restart unless-stopped \
  -p 80:80 \
  --network community-network \
  avishka2002/community-events-frontend:latest

# Wait for it to start
sleep 10

# Check status
sudo docker ps

# Test it
curl -I http://localhost/
```

4. **Verify**: 
   - Open http://13.220.61.29 in your browser
   - Press `Ctrl+Shift+Delete` to clear browser cache
   - Try logging in - it should work now!

---

### Option 2: If You Have SSH Key

If you have the `community-events-key-prod.pem` file:

```bash
# Make executable
chmod +x update-frontend.sh

# Run update script
./update-frontend.sh
```

---

### Option 3: Using Docker Compose (if you have SSH access)

```bash
# SSH to instance
ssh -i community-events-key-prod.pem ubuntu@13.220.61.29

# Pull latest images
cd /tmp
sudo docker compose -f docker-compose.yml pull frontend

# Restart frontend only
sudo docker compose -f docker-compose.yml up -d frontend

# Check logs
sudo docker logs community_frontend --tail 50
```

---

## 🎯 What Changed

### Before:
- Frontend tried to connect to: `http://18.215.189.159:4000/api/...`
- This IP is wrong/old
- Backend wasn't accessible

### After:
- Frontend uses relative URLs: `/api/...`
- Nginx proxies `/api/` → `http://localhost:4000/api/`
- Backend on same server responds correctly

---

## 🔍 Why You Saw Wrong IP

The IP `18.215.189.159` was likely:
1. Hardcoded in an old build
2. Or from `process.env.REACT_APP_API_URL` during a previous build
3. The Docker image was built with that value baked in

**Solution**: I changed the config to use **relative URLs** so the frontend always talks to the same server it's hosted on.

---

##  AWS Console Region Issue

You were looking at **us-west-2 (Oregon)** in the screenshots, but your instance is in **us-east-1 (N. Virginia)**!

**To see your instance**:
1. Open AWS Console
2. Top right, change region to: **US East (N. Virginia) us-east-1**
3. Go to EC2 → Instances
4. You'll see: `i-064119cb154739571` with IP `13.220.61.29`

---

## ✅ Verification Steps

After deploying the fix:

1. **Clear browser cache**: `Ctrl+Shift+Delete` → Clear cached images and files
2. **Hard reload**: `Ctrl+F5`
3. **Test login**: Should connect to `/api/auth/login` successfully
4. **Check developer tools**: Network tab should show requests to `/api/...` not `18.215...`

---

## 🐛 If Still Not Working

Run these checks:

```bash
# Check if backend is running
curl http://13.220.61.29:4000/api/ping

# Should return: {"status":"ok","message":"Server is running"}

# Check if frontend is running
curl -I http://13.220.61.29

# Should return: HTTP/1.1 200 OK

# Test API proxy through frontend
curl http://13.220.61.29/api/ping

# Should return same as direct backend call
```

If backend is not responding, restart it:

```bash
# Connect to instance, then:
sudo docker restart community_backend
sudo docker logs community_backend --tail 50
```

---

## 📋 Quick Status Check

Run this anytime:

```bash
./check-deployment.sh
```

Should show all green ✓ checkmarks!

---

## 🎉 Expected Result

After the fix:
- ✅ Frontend loads at http://13.220.61.29
- ✅ Login works (connects to `/api/auth/login`)
- ✅ All API calls work
- ✅ No more `18.215.189.159` errors
- ✅ No more `ERR_CONNECTION_TIMED_OUT`

---

**Next Step**: Use **Option 1** above (EC2 Instance Connect) - it's the easiest and needs no SSH key!
