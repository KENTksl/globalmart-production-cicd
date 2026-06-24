###############################################################
# Module: ECS v2 — Multi-AZ Deployment
#
# Khác v1:
#   - Frontend deploy vào private-subnet-a (AZ-A)
#   - Backend deploy vào private-subnet-b (AZ-B)
#   - ALB Public và ALB Internal span 2 AZ
#   - Backend kết nối RDS qua Proxy endpoint
###############################################################

# ── CloudWatch Log Groups ─────────────────────────────────────
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project}-frontend"
  retention_in_days = 30
  tags              = { Name = "${var.project}-frontend-logs" }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project}-backend"
  retention_in_days = 30
  tags              = { Name = "${var.project}-backend-logs" }
}

# ── ECS Cluster ───────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = { Name = "${var.project}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

###############################################################
# ALB Internet Facing — span 2 AZ (public-subnet-a + b)
###############################################################
resource "aws_lb" "public" {
  name               = "${var.project}-alb-public"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.sg_alb_public_id]
  subnets            = var.public_subnet_ids # [public-subnet-a, public-subnet-b]

  enable_deletion_protection = false
  tags = { Name = "${var.project}-alb-public", Scope = "Internet-facing" }
}

# Target Group Blue (production)
resource "aws_lb_target_group" "frontend_blue" {
  name        = "${var.project}-tg-fe-blue"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # Fargate yêu cầu "ip"

  health_check {
    enabled             = true
    path                = "/"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  lifecycle { create_before_destroy = true }
  tags = { Name = "${var.project}-tg-frontend-blue" }
}

# Target Group Green (Blue/Green swap)
resource "aws_lb_target_group" "frontend_green" {
  name        = "${var.project}-tg-fe-green"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  lifecycle { create_before_destroy = true }
  tags = { Name = "${var.project}-tg-frontend-green" }
}

# Listener HTTP:80 — production traffic
resource "aws_lb_listener" "public_http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_blue.arn
  }
  lifecycle { ignore_changes = [default_action] } # CodeDeploy quản lý
}

# Listener HTTP:8080 — test traffic cho Blue/Green
resource "aws_lb_listener" "public_test" {
  load_balancer_arn = aws_lb.public.arn
  port              = 8080
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_green.arn
  }
  lifecycle { ignore_changes = [default_action] }
}

###############################################################
# ALB Internal — span 2 AZ (private-subnet-a + b)
# Frontend (AZ-A) → ALB Internal → Backend (AZ-B)
###############################################################
resource "aws_lb" "internal" {
  name               = "${var.project}-alb-internal"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [var.sg_alb_internal_id]
  # Span cả 2 private subnets để route được tới Backend ở AZ-B
  subnets            = concat(var.private_subnet_a_ids, var.private_subnet_b_ids)
  tags = { Name = "${var.project}-alb-internal", Scope = "Internal" }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project}-tg-backend"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  tags = { Name = "${var.project}-tg-backend" }
}

resource "aws_lb_listener" "internal_http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

###############################################################
# Task Definitions
###############################################################

# Frontend Task Def — chạy ở AZ-A
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${var.ecr_frontend_url}:latest"
    essential = true

    portMappings = [{ containerPort = var.frontend_port, protocol = "tcp" }]

    environment = [
      { name = "NODE_ENV",     value = "production" },
      # Frontend gọi Backend qua ALB Internal DNS
      { name = "BACKEND_URL", value = "http://${aws_lb.internal.dns_name}" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project}-frontend-taskdef", AZ = "A" }
}

# Backend Task Def — chạy ở AZ-B, kết nối RDS qua Proxy (Spring Boot Java App)
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_execution_role_arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${var.ecr_backend_url}:latest"
    essential = true

    portMappings = [{ containerPort = var.backend_port, protocol = "tcp" }]

    environment = [
      { name = "DB_HOST",  value = var.rds_proxy_endpoint },
      { name = "DB_PORT",  value = "3306" },
      { name = "DB_NAME",  value = "globalmart" }
    ]

    # DB credentials lấy từ Secrets Manager qua ECS secrets injection
    secrets = [
      {
        name      = "DB_USERNAME"
        valueFrom = "${var.db_secret_arn}:username::"
      },
      {
        name      = "DB_PASSWORD"
        valueFrom = "${var.db_secret_arn}:password::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project}-backend-taskdef", AZ = "B" }
}

###############################################################
# ECS Services — Frontend ở AZ-A, Backend ở AZ-B
###############################################################

# Frontend Service — private-subnet-a (AZ-A)
resource "aws_ecs_service" "frontend" {
  name            = "${var.project}-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_a_ids # AZ-A
    security_groups  = [var.sg_ecs_frontend_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend_blue.arn
    container_name   = "frontend"
    container_port   = var.frontend_port
  }

  deployment_controller { type = "CODE_DEPLOY" } # Blue/Green

  lifecycle { ignore_changes = [task_definition, load_balancer] }
  depends_on = [aws_lb_listener.public_http]
  tags = { Name = "${var.project}-frontend-service", AZ = "A" }
}

# Backend Service — private-subnet-b (AZ-B)
resource "aws_ecs_service" "backend" {
  name            = "${var.project}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_b_ids # AZ-B (KHÁC v1)
    security_groups  = [var.sg_ecs_backend_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.backend_port
  }

  deployment_controller { type = "ECS" } # Rolling update

  lifecycle { ignore_changes = [task_definition] }
  depends_on = [aws_lb_listener.internal_http]
  tags = { Name = "${var.project}-backend-service", AZ = "B" }
}
