###############################################################
# GlobalMart v2 — variables.tf
# Multi-AZ: 2 AZ, 2 NAT GW, RDS Multi-AZ, RDS Proxy
###############################################################

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}
variable "project" {
  type    = string
  default = "globalmart"
}
variable "environment" {
  type    = string
  default = "production"
}

# ── Networking ────────────────────────────────────────────────
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "2 AZs — v2 yêu cầu đúng 2 AZ"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]

  validation {
    condition     = length(var.availability_zones) == 2
    error_message = "v2 yêu cầu đúng 2 availability zones."
  }
}

variable "public_subnet_cidrs" {
  description = "2 Public Subnets: index 0 = AZ-A, index 1 = AZ-B"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "2 Private Subnets: index 0 = AZ-A (Frontend+RDS Primary), index 1 = AZ-B (Backend+RDS Standby)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ── GitHub ────────────────────────────────────────────────────
variable "github_owner" {
  type = string
}
variable "github_repo" {
  type = string
}
variable "github_branch" {
  type    = string
  default = "main"
}
variable "github_connection_arn" {
  type = string
}

# ── ECS ──────────────────────────────────────────────────────
variable "frontend_port" {
  type    = number
  default = 3000
}
variable "backend_port" {
  type    = number
  default = 8080
}
variable "frontend_desired_count" {
  type    = number
  default = 2
}
variable "backend_desired_count" {
  type    = number
  default = 2
}

# ── RDS Multi-AZ ─────────────────────────────────────────────
variable "db_name" {
  type    = string
  default = "globalmart"
}
variable "db_username" {
  type    = string
  default = "admin"
}
variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}
variable "db_allocated_storage" {
  type    = number
  default = 20
}
variable "backup_retention_period" {
  type    = number
  default = 7
}
variable "backup_window" {
  type    = string
  default = "18:00-19:00"
}

# ── Monitoring ────────────────────────────────────────────────
variable "alert_email" {
  description = "Email nhận CloudWatch Alarms (SNS sẽ gửi email xác nhận)"
  type        = string
}
