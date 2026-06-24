output "artifact_bucket_id"  { value = aws_s3_bucket.artifact.id }
output "artifact_bucket_arn" { value = aws_s3_bucket.artifact.arn }
output "backup_bucket_id"    { value = aws_s3_bucket.backup.id }
output "backup_bucket_arn"   { value = aws_s3_bucket.backup.arn }
output "alb_logs_bucket_id"  { value = aws_s3_bucket.alb_logs.id }
output "alb_logs_bucket_arn" { value = aws_s3_bucket.alb_logs.arn }
