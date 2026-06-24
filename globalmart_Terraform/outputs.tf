###############################################################
# GlobalMart v2 — outputs.tf
###############################################################

output "vpc_id" {
  value = module.vpc.vpc_id
}
output "alb_public_dns" {
  description = "Truy cập app qua URL này"
  value       = "http://${module.ecs.alb_public_dns}"
}
output "alb_internal_dns" {
  value = module.ecs.alb_internal_dns
}
output "ecr_frontend_url" {
  value = module.ecr.frontend_repository_url
}
output "ecr_backend_url" {
  value = module.ecr.backend_repository_url
}
output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}
output "codepipeline_name" {
  value = module.cicd.pipeline_name
}
output "sns_topic_arn" {
  value = module.monitoring.sns_topic_arn
}
output "artifact_bucket" {
  value = module.s3.artifact_bucket_id
}
output "backup_bucket" {
  value = module.s3.backup_bucket_id
}

output "rds_endpoint" {
  description = "RDS Primary endpoint (sensitive)"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint — Backend kết nối vào đây (không phải trực tiếp RDS)"
  value       = module.rds.proxy_endpoint
  sensitive   = true
}

output "db_secret_arn" {
  description = "Secrets Manager ARN chứa DB credentials"
  value       = module.rds.db_secret_arn
}

output "nat_gateway_az_a_ip" {
  value = module.vpc.nat_gateway_az_a_ip
}
output "nat_gateway_az_b_ip" {
  value = module.vpc.nat_gateway_az_b_ip
}

output "cloudwatch_dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${module.monitoring.dashboard_name}"
}
