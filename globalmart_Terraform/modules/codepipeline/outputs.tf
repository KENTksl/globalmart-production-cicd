output "pipeline_name"     { value = aws_codepipeline.main.name }
output "pipeline_arn"      { value = aws_codepipeline.main.arn }
output "codebuild_name"    { value = aws_codebuild_project.main.name }
output "codedeploy_app"    { value = aws_codedeploy_app.main.name }
output "deployment_group"  { value = aws_codedeploy_deployment_group.main.deployment_group_name }
