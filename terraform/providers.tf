# Terraform version and provider configuration
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing state
  # Uncomment this after creating S3 bucket for state storage
  # backend "s3" {
  #   bucket         = "community-events-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

# AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CommunityEvents"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}
