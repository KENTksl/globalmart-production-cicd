###############################################################
# Module: Monitoring v2
# SNS → Email/SMS alerts
# 8 CloudWatch Alarms (thêm RDS Proxy + RDS Failover vs v1)
# CloudWatch Dashboard Multi-AZ
# EventBridge rule cho RDS Failover event
###############################################################

# ── SNS Topic ─────────────────────────────────────────────────
resource "aws_sns_topic" "alerts" {
  name         = "${var.project}-alerts"
  display_name = "GlobalMart v2 Production Alerts"
  tags         = { Name = "${var.project}-sns-alerts" }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
  # Sau khi terraform apply: vào email, click "Confirm subscription"
}

# ── Alarm 1: ECS Frontend CPU > 80% ──────────────────────────
resource "aws_cloudwatch_metric_alarm" "ecs_frontend_cpu" {
  alarm_name          = "${var.project}-frontend-cpu-high"
  alarm_description   = "[AZ-A] ECS Frontend CPU vượt 80% trong 5 phút"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.frontend_service_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-fe-cpu" }
}

# ── Alarm 2: ECS Backend CPU > 80% ───────────────────────────
resource "aws_cloudwatch_metric_alarm" "ecs_backend_cpu" {
  alarm_name          = "${var.project}-backend-cpu-high"
  alarm_description   = "[AZ-B] ECS Backend CPU vượt 80% trong 5 phút"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.backend_service_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-be-cpu" }
}

# ── Alarm 3: ECS Frontend Memory > 85% ───────────────────────
resource "aws_cloudwatch_metric_alarm" "ecs_frontend_memory" {
  alarm_name          = "${var.project}-frontend-memory-high"
  alarm_description   = "[AZ-A] ECS Frontend Memory vượt 85%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.frontend_service_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-fe-memory" }
}

# ── Alarm 4: ALB 5xx Errors (quan trọng nhất) ─────────────────
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project}-alb-5xx-errors"
  alarm_description   = "ALB có lỗi 5xx > 10 trong 1 phút — cần xử lý ngay!"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60   # 1 phút — phản ứng nhanh
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  dimensions = { LoadBalancer = var.alb_arn_suffix }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-alb-5xx" }
}

# ── Alarm 5: RDS Storage thấp ─────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project}-rds-storage-low"
  alarm_description   = "RDS còn dưới 5GB — cần tăng dung lượng"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120  # 5 GB in bytes

  dimensions = { DBInstanceIdentifier = var.rds_identifier }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-rds-storage" }
}

# ── Alarm 6: RDS CPU > 80% ────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project}-rds-cpu-high"
  alarm_description   = "RDS CPU vượt 80% — có thể cần scale up instance"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = { DBInstanceIdentifier = var.rds_identifier }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-rds-cpu" }
}

# ── Alarm 7: RDS Proxy — Client Connections cao (MỚI v2) ──────
resource "aws_cloudwatch_metric_alarm" "rds_proxy_connections" {
  alarm_name          = "${var.project}-rds-proxy-connections-high"
  alarm_description   = "[MỚI v2] RDS Proxy client connections vượt 150 — connection pool sắp đầy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ClientConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 150

  dimensions = { ProxyName = var.rds_proxy_name }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-proxy-conn" }
}

# ── Alarm 8: RDS Proxy — Database Connections tới RDS (MỚI v2)
resource "aws_cloudwatch_metric_alarm" "rds_proxy_db_connections" {
  alarm_name          = "${var.project}-rds-proxy-db-connections"
  alarm_description   = "[MỚI v2] RDS Proxy → RDS connections vượt 80 — RDS sắp hết connection limit"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = { ProxyName = var.rds_proxy_name }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = { Name = "${var.project}-alarm-proxy-db-conn" }
}

# ── EventBridge: Alert khi RDS Failover xảy ra (MỚI v2) ───────
# Khi Primary (AZ-A) fail, AWS auto-failover sang Standby (AZ-B)
# Rule này bắt event đó và gửi alert ngay lập tức
resource "aws_cloudwatch_event_rule" "rds_failover" {
  name        = "${var.project}-rds-failover-event"
  description = "[MỚI v2] Alert khi RDS Multi-AZ failover xảy ra (Primary → Standby)"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Instance Event"]
    detail = {
      EventID  = ["RDS-EVENT-0049"]   # "Multi-AZ failover completed"
      SourceId = [var.rds_identifier]
    }
  })

  tags = { Name = "${var.project}-rds-failover-rule" }
}

resource "aws_cloudwatch_event_target" "rds_failover_sns" {
  rule      = aws_cloudwatch_event_rule.rds_failover.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

# Cho phép EventBridge publish vào SNS
resource "aws_sns_topic_policy" "allow_eventbridge" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSNSPublish"
        Effect = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowOwner"
        Effect = "Allow"
        Principal = { AWS = "*" }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = { "AWS:SourceOwner" = data.aws_caller_identity.current.account_id }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# ── CloudWatch Dashboard Multi-AZ (9 widgets) ─────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-ops-dashboard-v2"

  dashboard_body = jsonencode({
    widgets = [

      # Row 1: ECS CPU cả 2 services
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "ECS CPU Utilization (Frontend AZ-A | Backend AZ-B)"
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name,
             "ServiceName", var.frontend_service_name, { label = "Frontend (AZ-A)", color = "#1f77b4" }],
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name,
             "ServiceName", var.backend_service_name,  { label = "Backend (AZ-B)",  color = "#ff7f0e" }]
          ]
          yAxis = { left = { min = 0, max = 100 } }
          annotations = { horizontal = [{ value = 80, label = "Alert 80%", color = "#d62728" }] }
        }
      },

      # Row 1: ECS Memory
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "ECS Memory Utilization"
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name,
             "ServiceName", var.frontend_service_name, { label = "Frontend (AZ-A)" }],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name,
             "ServiceName", var.backend_service_name,  { label = "Backend (AZ-B)" }]
          ]
          yAxis = { left = { min = 0, max = 100 } }
          annotations = { horizontal = [{ value = 85, label = "Alert 85%", color = "#d62728" }] }
        }
      },

      # Row 2: ALB Requests + Errors
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "ALB Request Count (per minute)"
          view   = "timeSeries"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix,
             { stat = "Sum", label = "Total Requests", color = "#2ca02c" }]
          ]
          annotations = { horizontal = [] }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "ALB HTTP Errors — 4xx & 5xx"
          view   = "timeSeries"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", "LoadBalancer", var.alb_arn_suffix,
             { stat = "Sum", label = "4xx", color = "#ff7f0e" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix,
             { stat = "Sum", label = "5xx", color = "#d62728" }]
          ]
          annotations = { horizontal = [{ value = 10, label = "5xx Alert", color = "#d62728" }] }
        }
      },

      # Row 3: RDS Primary metrics
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          region = var.aws_region
          title  = "RDS Primary CPU & Connections"
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/RDS", "CPUUtilization",      "DBInstanceIdentifier", var.rds_identifier, { label = "CPU %" }],
            ["AWS/RDS", "DatabaseConnections",  "DBInstanceIdentifier", var.rds_identifier, { label = "Connections", yAxis = "right" }]
          ]
          yAxis = { left = { min = 0, max = 100 }, right = { min = 0 } }
          annotations = { horizontal = [] }
        }
      },

      # Row 3: RDS Storage
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          region = var.aws_region
          title  = "RDS Free Storage Space"
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_identifier,
             { stat = "Average", label = "Free Storage (bytes)" }]
          ]
          annotations = { horizontal = [{ value = 5368709120, label = "5GB Alert", color = "#d62728" }] }
        }
      },

      # Row 3: RDS Proxy Connections (MỚI v2)
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          region = var.aws_region
          title  = "RDS Proxy Connections (MỚI v2)"
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/RDS", "ClientConnections",   "ProxyName", var.rds_proxy_name,
             { label = "Client → Proxy",   color = "#9467bd" }],
            ["AWS/RDS", "DatabaseConnections", "ProxyName", var.rds_proxy_name,
             { label = "Proxy → RDS",      color = "#8c564b" }]
          ]
          annotations = {
            horizontal = [
              { value = 150, label = "Client Alert", color = "#9467bd" },
              { value = 80,  label = "DB Alert",     color = "#8c564b" }
            ]
          }
        }
      },

      # Row 4: ALB Target Health
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "ALB Healthy Host Count (Frontend)"
          view   = "timeSeries"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount",   "LoadBalancer", var.alb_arn_suffix,
             { stat = "Average", label = "Healthy Hosts",   color = "#2ca02c" }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", "LoadBalancer", var.alb_arn_suffix,
             { stat = "Average", label = "Unhealthy Hosts", color = "#d62728" }]
          ]
          annotations = { horizontal = [] }
        }
      },

      # Row 4: RDS Replica Lag (Multi-AZ sync lag)
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          region = var.aws_region
          title  = "RDS Replica Lag (Multi-AZ sync — MỚI v2)"
          view   = "timeSeries"
          period = 60
          metrics = [
            ["AWS/RDS", "ReplicaLag", "DBInstanceIdentifier", var.rds_identifier,
             { stat = "Average", label = "Replica Lag (seconds)", color = "#e377c2" }]
          ]
          annotations = { horizontal = [{ value = 30, label = "Lag Warning 30s", color = "#ff7f0e" }] }
        }
      },

      # Row 5: Alarm Status Overview
      {
        type   = "alarm"
        x      = 0
        y      = 24
        width  = 24
        height = 4
        properties = {
          title = "Alarm Status — Tổng quan tất cả 8 Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.ecs_frontend_cpu.arn,
            aws_cloudwatch_metric_alarm.ecs_backend_cpu.arn,
            aws_cloudwatch_metric_alarm.ecs_frontend_memory.arn,
            aws_cloudwatch_metric_alarm.alb_5xx.arn,
            aws_cloudwatch_metric_alarm.rds_storage_low.arn,
            aws_cloudwatch_metric_alarm.rds_cpu.arn,
            aws_cloudwatch_metric_alarm.rds_proxy_connections.arn,
            aws_cloudwatch_metric_alarm.rds_proxy_db_connections.arn,
          ]
        }
      }
    ]
  })
}
