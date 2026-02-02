# Terraform Backend Configuration
# This file configures where Terraform stores its state

# Option 1: Local backend (default - already active)
# State is stored in terraform.tfstate file locally
# Good for: Single developer, testing
# Note: You're already using this

# Option 2: S3 backend (recommended for production)
# Uncomment below when ready to use remote state storage
# Benefits: Team collaboration, state locking, backup

# terraform {
#   backend "s3" {
#     bucket         = "your-terraform-state-bucket-name"  # Create this bucket first
#     key            = "community-events/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "terraform-state-lock"  # Create this table for state locking
#   }
# }

# To switch to S3 backend:
# 1. Create S3 bucket: aws s3 mb s3://your-terraform-state-bucket-name
# 2. Create DynamoDB table for locking
# 3. Uncomment the backend configuration above
# 4. Run: terraform init -migrate-state
