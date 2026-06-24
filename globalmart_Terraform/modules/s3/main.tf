###############################################################
# Module: S3 — Artifact Bucket & Backup Bucket
###############################################################

# ── Artifact Bucket (CodePipeline artifacts) ─────────────────
resource "aws_s3_bucket" "artifact" {
  bucket        = "${var.project}-artifacts-${var.account_id}"
  force_destroy = true  # Cho phép xóa bucket kể cả khi có object (dùng trong dev)

  tags = { Name = "${var.project}-artifact-bucket", Purpose = "CI/CD Artifacts" }
}

resource "aws_s3_bucket_versioning" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "artifact" {
  bucket                  = aws_s3_bucket.artifact.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle: xóa artifacts cũ hơn 30 ngày
resource "aws_s3_bucket_lifecycle_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  rule {
    id     = "delete-old-artifacts"
    status = "Enabled"
    filter { prefix = "" }
    expiration { days = 30 }
  }
}

# ── Backup Bucket (RDS Snapshots/Exports) ────────────────────
resource "aws_s3_bucket" "backup" {
  bucket        = "${var.project}-backup-${var.account_id}"
  force_destroy = false  # KHÔNG cho xóa bucket backup khi có data!
  tags = { Name = "${var.project}-backup-bucket", Purpose = "RDS Backup and DR" }
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "backup" {
  bucket                  = aws_s3_bucket.backup.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle: Chuyển sang Glacier sau 30 ngày, xóa sau 365 ngày
resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "backup-lifecycle"
    status = "Enabled"
    filter { prefix = "" }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration { days = 365 }
  }
}

# ALB Access Logs Bucket
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${var.project}-alb-logs-${var.account_id}"
  force_destroy = true

  tags = { Name = "${var.project}-alb-logs", Purpose = "ALB Access Logs" }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket                  = aws_s3_bucket.alb_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ALB cần policy để ghi logs vào S3
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::114774131450:root" }  # AWS ELB Service Account ap-southeast-1
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.alb_logs.arn}/alb-public/*"
    }]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    filter { prefix = "" }
    expiration { days = 90 }
  }
}
