output "db_endpoint" {
  value     = aws_db_instance.main.address
  sensitive = true
}
output "db_port" {
  value = aws_db_instance.main.port
}
output "db_identifier" {
  value = aws_db_instance.main.identifier
}
output "db_instance_id" {
  value = aws_db_instance.main.id
}
output "db_arn" {
  value = aws_db_instance.main.arn
}
output "db_secret_arn" {
  value = aws_secretsmanager_secret.db.arn
}

# RDS Proxy outputs (MỚI v2)
output "proxy_endpoint" {
  value     = aws_db_proxy.main.endpoint
  sensitive = true
}
output "proxy_name" {
  value = aws_db_proxy.main.name
}
output "proxy_arn" {
  value = aws_db_proxy.main.arn
}
