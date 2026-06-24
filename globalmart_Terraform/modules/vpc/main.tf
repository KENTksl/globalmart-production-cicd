###############################################################
# Module: VPC v2 — Multi-AZ
# 2 Public Subnets + 2 Private Subnets
# 2 NAT Gateways (1 per AZ — tránh SPOF)
# 6 Security Groups (thêm sg-rds-proxy so với v1)
###############################################################

# ── VPC ──────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true # Bắt buộc để RDS hostname và Proxy endpoint resolve được
  tags                 = { Name = "${var.project}-vpc" }
}

# ── Public Subnets (1 per AZ) ────────────────────────────────
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project}-public-subnet-${count.index == 0 ? "a" : "b"}"
    AZ   = var.availability_zones[count.index]
    Tier = "Public"
  }
}

# ── Private Subnets (1 per AZ) ───────────────────────────────
# private[0] = AZ-A: chứa ECS Frontend + RDS Primary
# private[1] = AZ-B: chứa ECS Backend + RDS Standby
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  tags = {
    Name    = "${var.project}-private-subnet-${count.index == 0 ? "a" : "b"}"
    AZ      = var.availability_zones[count.index]
    Tier    = "Private"
    Purpose = count.index == 0 ? "Frontend+RDS-Primary" : "Backend+RDS-Standby"
  }
}

# ── Internet Gateway ─────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

# ── Elastic IPs cho 2 NAT Gateways ──────────────────────────
resource "aws_eip" "nat_a" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  tags       = { Name = "${var.project}-eip-nat-a", AZ = var.availability_zones[0] }
}

resource "aws_eip" "nat_b" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  tags       = { Name = "${var.project}-eip-nat-b", AZ = var.availability_zones[1] }
}

# ── 2 NAT Gateways (KHÁC v1 — v1 chỉ có 1) ─────────────────
# Mỗi AZ có NAT GW riêng → nếu 1 AZ chết, AZ kia vẫn ra Internet được
resource "aws_nat_gateway" "az_a" {
  allocation_id = aws_eip.nat_a.id
  subnet_id     = aws_subnet.public[0].id # Đặt trong Public Subnet AZ-A
  depends_on    = [aws_internet_gateway.main]
  tags          = { Name = "${var.project}-nat-gw-a", AZ = var.availability_zones[0] }
}

resource "aws_nat_gateway" "az_b" {
  allocation_id = aws_eip.nat_b.id
  subnet_id     = aws_subnet.public[1].id # Đặt trong Public Subnet AZ-B
  depends_on    = [aws_internet_gateway.main]
  tags          = { Name = "${var.project}-nat-gw-b", AZ = var.availability_zones[1] }
}

# ── Route Table: Public (dùng chung cho 2 public subnets) ────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-public-rt" }
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── Route Table: Private AZ-A → NAT-A ───────────────────────
# KHÁC v1: mỗi AZ có Route Table riêng, trỏ vào NAT GW của chính nó
resource "aws_route_table" "private_a" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-private-rt-a", AZ = var.availability_zones[0] }
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.az_a.id
  }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private[0].id
  route_table_id = aws_route_table.private_a.id
}

# ── Route Table: Private AZ-B → NAT-B ───────────────────────
resource "aws_route_table" "private_b" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-private-rt-b", AZ = var.availability_zones[1] }
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.az_b.id
  }
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private[1].id
  route_table_id = aws_route_table.private_b.id
}

###############################################################
# Security Groups — 6 SGs (thêm sg-rds-proxy so với v1)
###############################################################

# SG 1: ALB Internet Facing
resource "aws_security_group" "alb_public" {
  name        = "${var.project}-sg-alb-public"
  description = "ALB Public: HTTP/HTTPS from Internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }
  ingress {
    # Port test cho Blue/Green — chỉ mở tạm thời khi deploy
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Blue/Green test traffic"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-alb-public" }
}

# SG 2: ECS Frontend — chỉ nhận từ ALB Public
resource "aws_security_group" "ecs_frontend" {
  name        = "${var.project}-sg-ecs-frontend"
  description = "ECS Frontend: only from ALB Public"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.frontend_port
    to_port         = var.frontend_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_public.id]
    description     = "From ALB Public only"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-ecs-frontend" }
}

# SG 3: ALB Internal — nhận từ ECS Frontend
resource "aws_security_group" "alb_internal" {
  name        = "${var.project}-sg-alb-internal"
  description = "ALB Internal: only from ECS Frontend"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_frontend.id]
    description     = "From ECS Frontend"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-alb-internal" }
}

# SG 4: ECS Backend — nhận từ ALB Internal
resource "aws_security_group" "ecs_backend" {
  name        = "${var.project}-sg-ecs-backend"
  description = "ECS Backend: only from ALB Internal"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.backend_port
    to_port         = var.backend_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_internal.id]
    description     = "From ALB Internal"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-ecs-backend" }
}

# SG 5: RDS Proxy — nhận từ ECS Backend (MỚI v2)
resource "aws_security_group" "rds_proxy" {
  name        = "${var.project}-sg-rds-proxy"
  description = "RDS Proxy: only from ECS Backend, proxy between Backend and RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_backend.id]
    description     = "MySQL from ECS Backend to Proxy"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-rds-proxy" }
}

# SG 6: RDS — chỉ nhận từ RDS Proxy (lớp bảo vệ kép, MỚI v2)
# Backend không kết nối trực tiếp RDS, phải qua Proxy
resource "aws_security_group" "rds" {
  name        = "${var.project}-sg-rds"
  description = "RDS MySQL: only from RDS Proxy - port 3306 not open to internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_proxy.id]
    description     = "MySQL from RDS Proxy only"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-sg-rds" }
}
