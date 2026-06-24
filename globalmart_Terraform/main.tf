###############################################################
# GlobalMart v2 — Root main.tf
# Kiến trúc Multi-AZ: 2 AZ, 2 NAT GW, RDS Multi-AZ, RDS Proxy
###############################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # (Tùy chọn) Remote state — bỏ comment sau khi tạo bucket
  # backend "s3" {
  #   bucket = "globalmart-tfstate-${data.aws_caller_identity.current.account_id}"
  #   key    = "v2/production/terraform.tfstate"
  #   region = "ap-southeast-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "GlobalMart"
      Version     = "v2"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# ── 1. IAM (không đổi so với v1) ─────────────────────────────
module "iam" {
  source      = "./modules/iam"
  project     = var.project
  environment = var.environment
}

# ── 2. VPC Multi-AZ (VIẾT LẠI HOÀN TOÀN) ────────────────────
module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  # 2 Public + 2 Private subnets (1 per AZ each)
  public_subnet_cidrs  = var.public_subnet_cidrs   # AZ-A + AZ-B
  private_subnet_cidrs = var.private_subnet_cidrs  # AZ-A (Frontend+DB Primary) + AZ-B (Backend+DB Standby)

  frontend_port = var.frontend_port
  backend_port  = var.backend_port
}

# ── 3. ECR (không đổi) ────────────────────────────────────────
module "ecr" {
  source      = "./modules/ecr"
  project     = var.project
  environment = var.environment
}

# ── 4. S3 Buckets (không đổi) ─────────────────────────────────
module "s3" {
  source      = "./modules/s3"
  project     = var.project
  environment = var.environment
  account_id  = data.aws_caller_identity.current.account_id
}

# ── 5. RDS Multi-AZ + RDS Proxy (VIẾT LẠI HOÀN TOÀN) ─────────
module "rds" {
  source      = "./modules/rds"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id           = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnet_ids  # cả 2 AZ cho Multi-AZ
  sg_rds_id        = module.vpc.sg_rds_id
  sg_rds_proxy_id  = module.vpc.sg_rds_proxy_id

  db_name                 = var.db_name
  db_username             = var.db_username
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
}

# ── 6. ECS + ALB Multi-AZ (VIẾT LẠI) ─────────────────────────
module "ecs" {
  source      = "./modules/ecs"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids    # span 2 AZ cho ALB
  private_subnet_a_ids = module.vpc.private_subnet_a_ids # AZ-A → Frontend
  private_subnet_b_ids = module.vpc.private_subnet_b_ids # AZ-B → Backend

  sg_alb_public_id   = module.vpc.sg_alb_public_id
  sg_alb_internal_id = module.vpc.sg_alb_internal_id
  sg_ecs_frontend_id = module.vpc.sg_ecs_frontend_id
  sg_ecs_backend_id  = module.vpc.sg_ecs_backend_id

  ecr_frontend_url            = module.ecr.frontend_repository_url
  ecr_backend_url             = module.ecr.backend_repository_url
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn

  # Backend kết nối qua RDS Proxy thay vì trực tiếp RDS
  db_secret_arn       = module.rds.db_secret_arn
  rds_proxy_endpoint  = module.rds.proxy_endpoint

  frontend_port          = var.frontend_port
  backend_port           = var.backend_port
  frontend_desired_count = var.frontend_desired_count
  backend_desired_count  = var.backend_desired_count
}

# ── 7. CI/CD Pipeline (cập nhật nhẹ) ─────────────────────────
module "cicd" {
  source      = "./modules/codepipeline"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  github_branch         = var.github_branch
  github_connection_arn = var.github_connection_arn

  artifact_bucket_id   = module.s3.artifact_bucket_id
  artifact_bucket_arn  = module.s3.artifact_bucket_arn
  ecr_frontend_url     = module.ecr.frontend_repository_url
  ecr_backend_url      = module.ecr.backend_repository_url

  codebuild_role_arn    = module.iam.codebuild_role_arn
  codepipeline_role_arn = module.iam.codepipeline_role_arn
  codedeploy_role_arn   = module.iam.codedeploy_role_arn

  ecs_cluster_name          = module.ecs.cluster_name
  ecs_frontend_service_name = module.ecs.frontend_service_name
  ecs_backend_service_name  = module.ecs.backend_service_name

  alb_listener_arn      = module.ecs.alb_public_listener_arn
  alb_test_listener_arn = module.ecs.alb_public_test_listener_arn
  target_group_blue_arn = module.ecs.tg_frontend_blue_arn
  target_group_green_arn = module.ecs.tg_frontend_green_arn
}

# ── 8. Monitoring (thêm alarms cho RDS Proxy + Failover) ──────
module "monitoring" {
  source      = "./modules/monitoring"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  alert_email              = var.alert_email
  ecs_cluster_name         = module.ecs.cluster_name
  alb_arn_suffix           = module.ecs.alb_public_arn_suffix
  rds_identifier           = module.rds.db_identifier
  rds_proxy_name           = module.rds.proxy_name
  frontend_service_name    = module.ecs.frontend_service_name
  backend_service_name     = module.ecs.backend_service_name
}

# ── 9. Backup (không đổi logic, cập nhật target) ──────────────
module "backup" {
  source      = "./modules/backup"
  project     = var.project
  environment = var.environment
  account_id  = data.aws_caller_identity.current.account_id

  db_arn           = module.rds.db_arn
  backup_bucket_id  = module.s3.backup_bucket_id
  backup_bucket_arn = module.s3.backup_bucket_arn
  sns_topic_arn     = module.monitoring.sns_topic_arn
}
