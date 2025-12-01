# Outputs to display after deployment

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_url" {
  description = "Application Load Balancer URL"
  value       = "http://${module.alb.alb_dns_name}"
}

output "rds_endpoint" {
  description = "RDS MySQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value       = module.ec2.instance_ids
}

output "ec2_public_ips" {
  description = "EC2 instance public IPs"
  value       = module.ec2.public_ips
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "mysql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}"
  sensitive   = true
}

output "deployment_instructions" {
  description = "Post-deployment instructions"
  value = <<-EOT
    ========================================
    🎉 Deployment Complete!
    ========================================
    
    Frontend URL: http://${module.alb.alb_dns_name}
    Backend API: http://${module.alb.alb_dns_name}/api
    
    Database Endpoint: ${module.rds.db_endpoint}
    Database Name: ${var.db_name}
    
    EC2 Instance IPs: ${join(", ", module.ec2.public_ips)}
    
    To SSH into instances:
    ssh -i ~/.ssh/${var.key_name}.pem ec2-user@<instance-ip>
    
    To view application logs:
    ssh ec2-user@<instance-ip> "docker logs community_backend"
    ssh ec2-user@<instance-ip> "docker logs community_frontend"
    
    ========================================
  EOT
}
