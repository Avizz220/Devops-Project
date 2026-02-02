# 🔧 ALTERNATIVE SOLUTIONS - EC2 Instance Connect Failed

## Problem
EC2 Instance Connect is failing because the instance doesn't have the EC2 Instance Connect service installed.

## ✅ SOLUTION 1: Create New SSH Key and Connect (EASIEST)

Run these commands in your terminal:

```bash
# 1. Create a new SSH key pair in AWS
aws ec2 create-key-pair \
  --region us-east-1 \
  --key-name temp-access-key \
  --query 'KeyMaterial' \
  --output text > temp-access-key.pem

# 2. Set permissions
chmod 400 temp-access-key.pem

# 3. Add the new key to the instance (replace old key)
# Get current instance details
INSTANCE_ID="i-064119cb154739571"

# Stop the instance temporarily
aws ec2 stop-instances --region us-east-1 --instance-ids $INSTANCE_ID

# Wait for it to stop (about 30 seconds)
echo "Waiting for instance to stop..."
aws ec2 wait instance-stopped --region us-east-1 --instance-ids $INSTANCE_ID

# Detach old network interface and re-attach with new key
# This is complex, so let's use a simpler approach...
```

Actually, that's too complex. Here's a **MUCH EASIER** solution:

---

## ✅ SOLUTION 2: Use AWS CloudShell (NO SSH KEY NEEDED!)

AWS CloudShell gives you direct AWS CLI access without installing anything!

### Steps:

1. **Open CloudShell**:
   - Go to AWS Console: https://console.aws.amazon.com
   - Make sure you're in **us-east-1** region (top right)
   - Click the **CloudShell** icon (>_) in the top toolbar
   - Or go to: https://us-east-1.console.aws.amazon.com/cloudshell

2. **In CloudShell, run these commands**:

```bash
# Get the instance public IP
INSTANCE_IP=$(aws ec2 describe-instances \
  --region us-east-1 \
  --instance-ids i-064119cb154739571 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance IP: $INSTANCE_IP"

# Create the docker-compose file
cat > /tmp/docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: community_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: community_events
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - community-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-proot123"]
      timeout: 20s
      retries: 10

  backend:
    image: avishka2002/community-events-backend:latest
    container_name: community_backend
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: root123
      DB_NAME: community_events
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - community-network

  frontend:
    image: avishka2002/community-events-frontend:latest
    container_name: community_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - community-network

volumes:
  mysql_data:

networks:
  community-network:
    driver: bridge
EOF

# Now we need to SSH to the instance...
# But we don't have the SSH key in CloudShell either!
```

Hmm, we still need SSH access. Let me give you the **BEST** solution:

---

## ✅ SOLUTION 3: Use User Data to Update (BEST - No SSH Needed!)

We can update the instance using User Data without SSH!

### Steps:

1. **Go to EC2 Console**:
   - https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:
   - Select instance `i-064119cb154739571`

2. **Stop the Instance**:
   - Actions → Instance State → Stop instance
   - Wait for it to stop (about 30 seconds)

3. **Modify User Data**:
   - Actions → Instance Settings → Edit user data
   - Paste this script:

```bash
#!/bin/bash
# Update frontend container
docker pull avishka2002/community-events-frontend:latest
docker stop community_frontend || true
docker rm community_frontend || true
docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest

# Log the update
echo "Frontend updated at $(date)" >> /var/log/frontend-update.log
```

4. **Start the Instance**:
   - Actions → Instance State → Start instance
   - Wait 1-2 minutes for it to start and run the update script

5. **Verify**:
   - Open http://13.220.61.29 in your browser
   - Clear cache (Ctrl+Shift+Delete) and reload

---

## ✅ SOLUTION 4: Command Line Update via User Data (FASTEST!)

Run this single command from your local terminal:

```bash
wsl -d Ubuntu-24.04 bash << 'SCRIPT'
# Stop instance
aws ec2 stop-instances --region us-east-1 --instance-ids i-064119cb154739571

# Wait for stop
echo "Waiting for instance to stop..."
aws ec2 wait instance-stopped --region us-east-1 --instance-ids i-064119cb154739571

# Update user data
aws ec2 modify-instance-attribute \
  --region us-east-1 \
  --instance-id i-064119cb154739571 \
  --user-data "$(cat << 'EOF' | base64 -w 0
#!/bin/bash
docker pull avishka2002/community-events-frontend:latest
docker stop community_frontend || true
docker rm community_frontend || true
docker run -d --name community_frontend --restart unless-stopped -p 80:80 --network community-network avishka2002/community-events-frontend:latest
echo "Updated at $(date)" >> /var/log/update.log
EOF
)"

# Start instance
aws ec2 start-instances --region us-east-1 --instance-ids i-064119cb154739571

echo "✅ Instance is restarting with updated frontend..."
echo "⏳ Wait 2 minutes, then visit: http://13.220.61.29"
SCRIPT
```

---

## ✅ SOLUTION 5: Download SSH Key from Terraform

If you created this with Terraform, the key might be in your terraform directory:

```bash
# Check for key in terraform directory
ls -la terraform/*.pem
ls -la *.pem

# Or check if terraform created it
cd terraform
terraform output -json | grep -i key
```

---

## 🎯 RECOMMENDED: Use Solution 4

**Just run this command** from your Windows PowerShell or WSL terminal:

```bash
./update-via-userdata.sh
```

I'll create this script for you now!

---

**The EC2 Instance Connect issue is because:**
- The instance was likely created from a custom AMI
- It doesn't have `ec2-instance-connect` package installed
- Normal for instances created via Terraform without specific configuration

**User Data approach works because:**
- It runs on boot as root
- Doesn't need SSH
- Automatically updates the containers
- Instance restarts with new configuration
