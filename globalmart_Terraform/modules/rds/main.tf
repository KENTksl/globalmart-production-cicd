###############################################################
# Module: RDS v2 — MySQL Multi-AZ + RDS Proxy
#
# Kiến trúc:
#   ECS Backend → sg-rds-proxy
#              → RDS Proxy (connection pooling)
#              → RDS Primary (AZ-A, private-subnet-a)
#                     ↕ sync replication
#              → RDS Standby (AZ-B, private-subnet-b) [auto failover]
###############################################################

# ── Random password ──────────────────────────────────────────
resource "random_password" "db" {
  length           = 20
  special          = true
  override_special = "!#$%&()-_=+[]<>?"
}

# ── Secrets Manager — DB Credentials ─────────────────────────
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project}/db-credentials-v2"
  description             = "RDS MySQL credentials cho GlobalMart v2"
  recovery_window_in_days = 7
  tags                    = { Name = "${var.project}-db-secret" }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  # Lưu dưới dạng JSON — RDS Proxy yêu cầu format này để đọc credentials
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    host     = aws_db_instance.main.address
    port     = 3306
    dbname   = var.db_name
    # Proxy endpoint sẽ được update sau khi proxy tạo xong
  })

  # Đợi RDS tạo xong mới ghi endpoint vào secret
  depends_on = [aws_db_instance.main]
}

# ── DB Subnet Group (span 2 AZ — bắt buộc cho Multi-AZ) ─────
resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  description = "Multi-AZ DB Subnet Group: AZ-A (Primary) + AZ-B (Standby)"
  subnet_ids  = var.subnet_ids # [private-subnet-a, private-subnet-b]
  tags        = { Name = "${var.project}-db-subnet-group" }
}

# ── DB Parameter Group ────────────────────────────────────────
resource "aws_db_parameter_group" "main" {
  name   = "${var.project}-mysql8-params"
  family = "mysql8.0"

  parameter {
    name  = "slow_query_log"
    value = "1"
  }
  parameter {
    name  = "long_query_time"
    value = "2" # Log queries chậm hơn 2 giây
  }
  parameter {
    name  = "log_output"
    value = "FILE"
  }
  parameter {
    # Bắt buộc khi dùng RDS Proxy với IAM auth
    name  = "require_secure_transport"
    value = "0"
    apply_method = "immediate"
  }

  tags = { Name = "${var.project}-mysql8-params" }
}

# ── RDS Monitoring Role ───────────────────────────────────────
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project}-rds-monitoring-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ── RDS MySQL Multi-AZ Instance (THAY ĐỔI LỚN v2) ───────────
resource "aws_db_instance" "main" {
  identifier = "${var.project}-db"

  # Engine
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100 # Auto-scaling tới 100GB
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  parameter_group_name = aws_db_parameter_group.main.name

  # *** Multi-AZ = true (KHÁC v1) ***
  # AWS tự động tạo Standby ở AZ thứ 2 trong subnet group
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_rds_id]
  publicly_accessible    = false

  # Backup — lấy từ Standby nên không ảnh hưởng Primary performance
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = "Mon:19:00-Mon:20:00"
  copy_tags_to_snapshot   = true

  # Enhanced Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # CloudWatch Logs exports
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Performance Insights - disabled for db.t3.micro
  performance_insights_enabled          = false

  # Protection
  deletion_protection       = false # Set true khi production thực sự
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project}-db-final-snapshot-v2"

  apply_immediately = true

  tags = {
    Name = "${var.project}-rds-mysql-multi-az"
    Mode = "Multi-AZ"
  }
}

###############################################################
# RDS Proxy (HOÀN TOÀN MỚI so với v1)
#
# Lợi ích:
#   1. Connection pooling: giảm số connections trực tiếp tới RDS
#   2. Failover transparent: khi Primary fail, Proxy tự route
#      sang Standby mà app không bị disconnect
#   3. IAM auth: không cần lưu password trong app
###############################################################

# IAM Role cho RDS Proxy
resource "aws_iam_role" "rds_proxy" {
  name = "${var.project}-rds-proxy-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name = "${var.project}-rds-proxy-secrets-policy"
  role = aws_iam_role.rds_proxy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = [aws_secretsmanager_secret.db.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = "*"
        Condition = { StringEquals = { "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com" } }
      }
    ]
  })
}

resource "aws_db_proxy" "main" {
  name                   = "${var.project}-db-proxy"
  debug_logging          = false
  engine_family          = "MYSQL"
  idle_client_timeout    = 1800 # 30 phút idle → disconnect
  require_tls            = false
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_security_group_ids = [var.sg_rds_proxy_id]
  vpc_subnet_ids         = var.subnet_ids # Proxy đặt trong cả 2 private subnets

  auth {
    auth_scheme = "SECRETS"
    description = "DB credentials từ Secrets Manager"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.db.arn
  }

  tags = { Name = "${var.project}-rds-proxy" }

  depends_on = [aws_secretsmanager_secret_version.db]
}

# Proxy Target — trỏ proxy tới RDS instance
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = 120  # Đợi tối đa 120s để lấy connection
    max_connections_percent      = 100  # Dùng tối đa 100% connections của RDS
    max_idle_connections_percent = 50   # Giữ 50% connections dạng idle pool
  }
}

resource "aws_db_proxy_target" "main" {
  db_instance_identifier = aws_db_instance.main.identifier
  db_proxy_name          = aws_db_proxy.main.name
  target_group_name      = aws_db_proxy_default_target_group.main.name
}

# ── CloudWatch Log Group cho RDS Proxy ───────────────────────
resource "aws_cloudwatch_log_group" "rds_proxy" {
  name              = "/aws/rds/proxy/${var.project}-db-proxy"
  retention_in_days = 14
  tags              = { Name = "${var.project}-rds-proxy-logs" }
}
