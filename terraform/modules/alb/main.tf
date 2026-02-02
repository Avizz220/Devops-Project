# Application Load Balancer Module

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "${var.project_name}-alb-${var.environment}"
  }
}

# Target Group for Frontend (Port 80)
resource "aws_lb_target_group" "frontend" {
  name_prefix = "fe-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-frontend-tg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Backend API (Port 4000)
resource "aws_lb_target_group" "backend" {
  name_prefix = "be-"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-backend-tg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = {
    Name = "${var.project_name}-http-listener-${var.environment}"
  }
}

# Listener Rule for Backend API (/api/*)
resource "aws_lb_listener_rule" "backend_api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-backend-rule-${var.environment}"
  }
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "frontend" {
  count            = length(var.instance_ids)
  target_group_arn = aws_lb_target_group.frontend.arn
  target_id        = var.instance_ids[count.index]
  port             = 80
}

resource "aws_lb_target_group_attachment" "backend" {
  count            = length(var.instance_ids)
  target_group_arn = aws_lb_target_group.backend.arn
  target_id        = var.instance_ids[count.index]
  port             = 4000
}
