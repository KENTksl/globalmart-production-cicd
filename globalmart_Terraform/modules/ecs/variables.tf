variable "project"                    { type = string }
variable "environment"                { type = string }
variable "aws_region"                 { type = string }
variable "vpc_id"                     { type = string }
variable "public_subnet_ids"          { type = list(string) }
variable "private_subnet_a_ids"       { type = list(string) }   # AZ-A → Frontend
variable "private_subnet_b_ids"       { type = list(string) }   # AZ-B → Backend
variable "sg_alb_public_id"           { type = string }
variable "sg_alb_internal_id"         { type = string }
variable "sg_ecs_frontend_id"         { type = string }
variable "sg_ecs_backend_id"          { type = string }
variable "ecr_frontend_url"           { type = string }
variable "ecr_backend_url"            { type = string }
variable "ecs_task_execution_role_arn"{ type = string }
variable "db_secret_arn"              { type = string }
variable "rds_proxy_endpoint"         { type = string }   # MỚI v2 — Backend kết nối qua Proxy
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
