variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for free tier deployment"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2"
  type        = string
}

variable "dockerhub_username" {
  description = "Docker Hub username"
  type        = string
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = string
  default     = "3306"
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "backend_port" {
  description = "Backend application port"
  type        = number
}
