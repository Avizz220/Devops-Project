module "vpc" {
  source               = "./modules/vpc"
  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "security" {
  source       = "./modules/security"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  depends_on   = [module.vpc]
}

# RDS Module - Disabled due to AWS account restrictions
# Using containerized MySQL instead (see user-data.sh)
# module "rds" {
#   source             = "./modules/rds"
#   project_name       = var.project_name
#   environment        = var.environment
#   db_name            = var.db_name
#   db_username        = var.db_username
#   db_password        = var.db_password
#   db_instance_class  = var.db_instance_class
#   private_subnet_ids = module.vpc.private_subnet_ids
#   security_group_id  = module.security.rds_security_group_id
#   depends_on         = [module.vpc, module.security]
# }

module "ec2" {
  source             = "./modules/ec2"
  project_name       = var.project_name
  environment        = var.environment
  instance_count     = 1
  instance_type      = var.instance_type
  key_name           = var.key_name
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = module.security.ec2_security_group_id
  dockerhub_username = var.dockerhub_username
  frontend_image_tag = var.frontend_image_tag
  backend_image_tag  = var.backend_image_tag
  db_host            = "mysql"  # MySQL container name
  db_port            = "3306"
  db_name            = var.db_name
  db_user            = var.db_username
  db_password        = var.db_password
  backend_port       = var.backend_port
  depends_on         = [module.vpc, module.security]
}
