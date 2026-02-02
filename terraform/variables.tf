# Global variables for the infrastructure

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name to be used in resource naming"
  type        = string
  default     = "community-events"
}

variable "dockerhub_username" {
  description = "Docker Hub username"
  type        = string
  default     = "avishka2002"
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
  default     = "latest"
}

# Database variables
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "community_events"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "appuser"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = "StrongPasswordHere123!"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t2.micro"
}

# EC2 variables
variable "instance_type" {
  description = "EC2 instance type (Free Tier eligible)"
  type        = string
  default     = "t3.micro"  # t3.micro is more widely available in free tier
}

variable "key_name" {
  description = "SSH key pair name for EC2 instances (optional - leave null for automated deployments without SSH)"
  type        = string
  default     = null
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Application variables
variable "backend_port" {
  description = "Backend application port"
  type        = number
  default     = 4000
}

variable "frontend_port" {
  description = "Frontend application port"
  type        = number
  default     = 80
}
