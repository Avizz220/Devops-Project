# Terraform AWS Deployment Guide

## 🎯 What This Does

This Terraform configuration automatically deploys your **Community Events** application to AWS with:

- ✅ **VPC** with public and private subnets across 2 availability zones
- ✅ **RDS MySQL** database (managed, auto-backup, encrypted)
- ✅ **EC2 instances** (2 servers running your Docker containers)
- ✅ **Application Load Balancer** (distributes traffic, health checks)
- ✅ **Security Groups** (firewall rules for all components)
- ✅ **Auto-scaling ready** infrastructure

## 📋 Prerequisites

### 1. Install Required Tools

#### AWS CLI
```bash
# Linux/WSL
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows (PowerShell as Administrator)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

Verify installation:
```bash
aws --version
```

#### Terraform
```bash
# Linux/WSL
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Windows (using Chocolatey)
choco install terraform
```

Verify installation:
```bash
terraform --version
```

### 2. Configure AWS Credentials

You need an AWS account with appropriate permissions.

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

Verify credentials:
```bash
aws sts get-caller-identity
```

You should see your AWS account ID and user ARN.

### 3. Ensure Docker Images are Pushed

Make sure your Docker images are available on Docker Hub:
- `avishka2002/community-events-frontend:latest`
- `avishka2002/community-events-backend:latest`

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

#### Using WSL/Linux:
```bash
cd terraform/scripts
chmod +x deploy.sh
./deploy.sh
```

#### Using PowerShell:
```powershell
cd terraform\scripts
.\deploy.ps1
```

### Option 2: Manual Deployment

1. **Navigate to terraform directory:**
```bash
cd terraform
```

2. **Initialize Terraform:**
```bash
terraform init
```

3. **Review the plan:**
```bash
terraform plan
```

4. **Apply the configuration:**
```bash
terraform apply
```

Type `yes` when prompted.

## 📊 What Gets Created

### AWS Resources:

1. **Networking (VPC)**
   - 1 VPC (`10.0.0.0/16`)
   - 2 Public Subnets (for Load Balancer)
   - 2 Private Subnets (for EC2 and RDS)
   - Internet Gateway
   - NAT Gateway
   - Route Tables

2. **Compute (EC2)**
   - 2 EC2 instances (`t3.medium`)
   - Amazon Linux 2023
   - Docker pre-installed
   - Auto-start your containers on boot
   - Elastic IPs for SSH access

3. **Database (RDS)**
   - MySQL 8.0 (`db.t3.micro`)
   - 20GB storage (auto-scaling up to 100GB)
   - Automated backups (7 days)
   - Encrypted at rest

4. **Load Balancing (ALB)**
   - Application Load Balancer
   - Frontend target group (port 80)
   - Backend target group (port 4000)
   - Health checks

5. **Security**
   - ALB Security Group (allows HTTP/HTTPS from internet)
   - EC2 Security Group (allows traffic from ALB + SSH)
   - RDS Security Group (allows MySQL from EC2 only)

## 🔍 After Deployment

### Check Deployment Status

```bash
cd terraform/scripts
chmod +x status.sh
./status.sh
```

### Get Application URL

```bash
cd terraform
terraform output alb_url
```

Access your app at: `http://<alb-dns-name>`

### SSH into EC2 Instance

```bash
# Get instance IP
terraform output ec2_public_ips

# SSH
ssh -i ~/.ssh/community-events-key.pem ec2-user@<instance-ip>
```

### View Docker Logs

```bash
# SSH into instance first, then:
docker logs community_events_backend
docker logs community_events_frontend
docker ps
```

### Check Database Connection

```bash
# SSH into instance, then:
mysql -h <rds-endpoint> -u appuser -p community_events
```

## 💰 Cost Estimation

Monthly AWS costs (approximate):

| Resource | Type | Est. Cost |
|----------|------|-----------|
| EC2 instances (2x) | t3.medium | $60/month |
| RDS MySQL | db.t3.micro | $15/month |
| ALB | Application LB | $20/month |
| NAT Gateway | - | $32/month |
| Data Transfer | 100GB | $9/month |
| **Total** | | **~$136/month** |

💡 **To reduce costs:**
- Use `t3.small` for EC2
- Use `db.t3.micro` for RDS (already default)
- Delete resources when not in use: `terraform destroy`

## 🗑️ Destroy Infrastructure

**⚠️ WARNING: This deletes ALL resources!**

```bash
cd terraform/scripts
chmod +x destroy.sh
./destroy.sh
```

Or manually:
```bash
cd terraform
terraform destroy
```

## 🔧 Customization

Edit `terraform/variables.tf` to customize:

```hcl
variable "instance_type" {
  default = "t3.small"  # Change instance size
}

variable "db_instance_class" {
  default = "db.t3.micro"  # Change database size
}

variable "environment" {
  default = "prod"  # Change environment name
}
```

## 🐛 Troubleshooting

### Issue: "Error creating EC2 KeyPair"
**Solution**: Key pair already exists. Either:
- Use existing key: Update `key_name` variable
- Delete existing key: `aws ec2 delete-key-pair --key-name community-events-key`

### Issue: "Insufficient capacity"
**Solution**: Change availability zones in `variables.tf`:
```hcl
variable "availability_zones" {
  default = ["us-east-1c", "us-east-1d"]
}
```

### Issue: "Target unhealthy in target group"
**Solution**: 
1. Wait 5-10 minutes for Docker containers to start
2. Check EC2 logs: `ssh` into instance and run `docker logs`
3. Verify security groups allow traffic

### Issue: "Database connection failed"
**Solution**:
1. Check RDS is in "available" state: `aws rds describe-db-instances`
2. Verify security group allows port 3306
3. Check database credentials in EC2 environment variables

## 📁 Project Structure

```
terraform/
├── main.tf                 # Main orchestration
├── providers.tf            # AWS provider config
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── modules/
│   ├── vpc/               # VPC and networking
│   ├── security/          # Security groups
│   ├── rds/               # MySQL database
│   ├── ec2/               # EC2 instances
│   └── alb/               # Load balancer
└── scripts/
    ├── deploy.sh          # Deployment script (Linux)
    ├── deploy.ps1         # Deployment script (Windows)
    ├── destroy.sh         # Cleanup script
    └── status.sh          # Status check script
```

## 🔄 CI/CD Integration

See [CI-CD-INTEGRATION.md](./CI-CD-INTEGRATION.md) for Jenkins and GitHub Actions integration.

## 📞 Support

For issues:
1. Check AWS CloudWatch logs
2. Review Terraform state: `terraform show`
3. Validate configuration: `terraform validate`
4. Check AWS console for resource status

## 🎓 Learning Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Docker Documentation](https://docs.docker.com/)
