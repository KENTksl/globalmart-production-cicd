output "codepipeline_role_arn"       { value = aws_iam_role.codepipeline.arn }
output "codebuild_role_arn"          { value = aws_iam_role.codebuild.arn }
output "ecs_task_execution_role_arn" { value = aws_iam_role.ecs_task_execution.arn }
output "codedeploy_role_arn"         { value = aws_iam_role.codedeploy.arn }
output "rds_export_role_arn"         { value = aws_iam_role.rds_export.arn }
