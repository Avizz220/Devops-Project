# EC2 Module - Compute instances to run Docker containers

data "aws_ssm_parameter" "ubuntu_2404_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name_prefix = "${var.project_name}-ec2-role-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-role-${var.environment}"
  }
}

# Attach AmazonSSMManagedInstanceCore policy for Systems Manager
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach ECR read-only policy to pull Docker images
resource "aws_iam_role_policy_attachment" "ecr" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-ec2-profile-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name = "${var.project_name}-ec2-profile-${var.environment}"
  }
}

# User Data Script to install Docker and run containers
locals {
  user_data = templatefile("${path.module}/user-data.sh", {
    dockerhub_username = var.dockerhub_username
    frontend_image_tag = var.frontend_image_tag
    backend_image_tag  = var.backend_image_tag
    db_host            = var.db_host
    db_port            = var.db_port
    db_name            = var.db_name
    db_user            = var.db_user
    db_password        = var.db_password
    backend_port       = var.backend_port
    project_name       = var.project_name
  })
}

# EC2 Instances
resource "aws_instance" "app" {
  count                  = var.instance_count
  ami                    = data.aws_ssm_parameter.ubuntu_2404_ami.value
  instance_type          = var.instance_type
  key_name               = var.key_name != null && var.key_name != "" ? var.key_name : null
  subnet_id              = var.public_subnet_ids[count.index % length(var.public_subnet_ids)]
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data = local.user_data

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-app-${count.index + 1}-${var.environment}"
  }

  lifecycle {
    ignore_changes = [user_data]
  }
}

