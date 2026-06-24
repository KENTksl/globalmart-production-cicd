output "vpc_id"             { value = aws_vpc.main.id }

# All subnets
output "public_subnet_ids"  { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }  # cả 2 cho RDS Multi-AZ subnet group

# AZ-specific (ECS deployment)
output "private_subnet_a_ids" { value = [aws_subnet.private[0].id] } # AZ-A → Frontend
output "private_subnet_b_ids" { value = [aws_subnet.private[1].id] } # AZ-B → Backend

# Security Groups
output "sg_alb_public_id"   { value = aws_security_group.alb_public.id }
output "sg_alb_internal_id" { value = aws_security_group.alb_internal.id }
output "sg_ecs_frontend_id" { value = aws_security_group.ecs_frontend.id }
output "sg_ecs_backend_id"  { value = aws_security_group.ecs_backend.id }
output "sg_rds_proxy_id"    { value = aws_security_group.rds_proxy.id }
output "sg_rds_id"          { value = aws_security_group.rds.id }

# NAT Gateway IPs (useful for whitelisting)
output "nat_gateway_az_a_ip" { value = aws_eip.nat_a.public_ip }
output "nat_gateway_az_b_ip" { value = aws_eip.nat_b.public_ip }
