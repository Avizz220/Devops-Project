output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "application_url" {
  description = "Application URL"
  value       = "http://${module.ec2.public_ips[0]}"
}

output "backend_api_url" {
  description = "Backend API URL"
  value       = "http://${module.ec2.public_ips[0]}:4000/api"
}

# RDS outputs - Disabled (using containerized MySQL)
# output "rds_endpoint" {
#   description = "RDS MySQL endpoint"
#   value       = module.rds.db_endpoint
#   sensitive   = true
# }

output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value       = module.ec2.instance_ids
}

output "ec2_public_ips" {
  description = "EC2 instance public IPs"
  value       = module.ec2.public_ips
}

output "database_info" {
  description = "Database connection info"
  value       = "MySQL running in Docker container on EC2 (localhost:3306)"
}

# output "database_connection_string" {
#   description = "Database connection string"
#   value       = "mysql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}"
#   sensitive   = true
# }

output "deployment_instructions" {
  description = "Post-deployment instructions"
  value = <<-EOT
    ✅ Deployment Complete - Containerized Setup
    
    Frontend: http://${module.ec2.public_ips[0]}
    Backend API: http://${module.ec2.public_ips[0]}:4000/api
    Database: MySQL container on EC2 (port 3306)
    ${var.key_name != null && var.key_name != "" ? "\n    SSH Access: ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${module.ec2.public_ips[0]}" : ""}
    
    Access via AWS Systems Manager Session Manager (no SSH key required):
    aws ssm start-session --target ${module.ec2.instance_ids[0]}
    
    Check containers: docker ps
    View logs: docker-compose logs -f
    Restart services: docker-compose restart
  EOT
}
