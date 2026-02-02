# RDS MySQL Module - Managed MySQL Database

# DB Subnet Group (for Multi-AZ deployment)
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.project_name}-db-subnet-"
  subnet_ids  = var.private_subnet_ids
  description = "Database subnet group for ${var.project_name}"

  tags = {
    Name = "${var.project_name}-db-subnet-group-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "mysql" {
  identifier = "${var.project_name}-mysql-${var.environment}"

  # Engine configuration
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  allocated_storage     = 20
  max_allocated_storage = 0  # Disable auto-scaling for free tier
  storage_type          = "gp2"  # gp2 is free tier, gp3 is not
  storage_encrypted     = false  # Encryption not available in free tier

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  publicly_accessible    = false
  multi_az               = false # Set to true for production

  # Backup configuration
  backup_retention_period = 0
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # Performance configuration
  performance_insights_enabled = false
  monitoring_interval          = 0

  # Deletion protection
  deletion_protection       = false # Set to true for production
  skip_final_snapshot       = true  # Set to false for production
  final_snapshot_identifier = "${var.project_name}-mysql-final-snapshot-${var.environment}"

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Parameter group
  parameter_group_name = aws_db_parameter_group.mysql.name

  tags = {
    Name = "${var.project_name}-mysql-${var.environment}"
  }

  lifecycle {
    ignore_changes = [password]
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "mysql" {
  name_prefix = "${var.project_name}-mysql-params-"
  family      = "mysql8.0"
  description = "Custom parameter group for ${var.project_name}"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  tags = {
    Name = "${var.project_name}-mysql-params-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
