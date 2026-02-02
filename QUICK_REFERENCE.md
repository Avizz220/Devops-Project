# 🚀 Quick Reference Guide

## Your Application is LIVE! 🎉

**Frontend**: http://13.220.61.29  
**Backend**: http://13.220.61.29:4000

---

## Quick Commands

### Check if everything is running
```bash
./check-deployment.sh
```

### Test endpoints manually
```bash
# Frontend
curl http://13.220.61.29

# Backend health
curl http://13.220.61.29:4000/api/health

# Backend API
curl http://13.220.61.29:4000/api/events
```

### Get AWS instance info
```bash
aws ec2 describe-instances --region us-east-1 --instance-ids i-064119cb154739571
```

---

## What's Running

✅ **EC2 Instance**: i-064119cb154739571 (us-east-1)  
✅ **Frontend**: Port 80 (React + Nginx)  
✅ **Backend**: Port 4000 (Node.js + Express)  
✅ **Database**: Port 3306 (MySQL 8.0)  

---

## Need More Details?

See [DEPLOYMENT_SUCCESS_SUMMARY.md](DEPLOYMENT_SUCCESS_SUMMARY.md) for complete documentation.

---

## Common Tasks

### Restart application
```bash
# SSH to instance (need key)
ssh -i community-events-key-prod.pem ubuntu@13.220.61.29

# Restart containers
sudo docker compose -f /tmp/docker-compose.yml restart
```

### View logs
```bash
# SSH to instance first, then:
sudo docker logs community_backend
sudo docker logs community_frontend
sudo docker logs community_mysql
```

### Update application
```bash
# SSH to instance, then:
sudo docker compose -f /tmp/docker-compose.yml pull
sudo docker compose -f /tmp/docker-compose.yml up -d
```

---

## 📊 Status Check Result

Last checked: February 2, 2026

```
Frontend (http://13.220.61.29): ✓ OK (HTTP 200)
Backend Health (http://13.220.61.29:4000/api/health): ✓ OK (HTTP 200)
Backend API (http://13.220.61.29:4000/api/events): ✓ OK (HTTP 200)
```

**Status**: 🟢 ALL SYSTEMS OPERATIONAL
