###############################################################
# Module: CodePipeline v2
# CodeBuild → build Docker image → push ECR
# CodeDeploy → Blue/Green deploy lên ECS Frontend
# Pipeline: Source (GitHub) → Build → Deploy
###############################################################

# ── CloudWatch Log Group cho CodeBuild ───────────────────────
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/codebuild/${var.project}"
  retention_in_days = 14
  tags              = { Name = "${var.project}-codebuild-logs" }
}

# ── CodeBuild Project ─────────────────────────────────────────
resource "aws_codebuild_project" "main" {
  name          = "${var.project}-build"
  description   = "Build Docker images cho Frontend và Backend, push lên ECR"
  build_timeout = 20
  service_role  = var.codebuild_role_arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true  # BẮT BUỘC để chạy Docker daemon bên trong CodeBuild

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }
    environment_variable {
      name  = "ECR_FRONTEND_URL"
      value = var.ecr_frontend_url
    }
    environment_variable {
      name  = "ECR_BACKEND_URL"
      value = var.ecr_backend_url
    }
    environment_variable {
      name  = "ECS_CLUSTER"
      value = var.ecs_cluster_name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"  # File này phải có trong root của GitHub repo
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "build"
    }
  }

  tags = { Name = "${var.project}-codebuild" }
}

# ── CodeDeploy Application ────────────────────────────────────
resource "aws_codedeploy_app" "main" {
  name             = "${var.project}-ecs-deploy"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "main" {
  app_name               = aws_codedeploy_app.main.name
  deployment_group_name  = "${var.project}-deployment-group"
  service_role_arn       = var.codedeploy_role_arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  # Tự động rollback nếu deploy thất bại
  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }
    # Giữ Blue thêm 5 phút sau khi Green healthy → dễ rollback nếu cần
    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  ecs_service {
    cluster_name = var.ecs_cluster_name
    service_name = var.ecs_frontend_service_name
  }

  load_balancer_info {
    target_group_pair_info {
      # Production listener (port 80)
      prod_traffic_route {
        listener_arns = [var.alb_listener_arn]
      }
      # Test listener (port 8080) — kiểm tra Green trước khi chuyển traffic
      test_traffic_route {
        listener_arns = [var.alb_test_listener_arn]
      }

      target_group {
        name = split("/", var.target_group_blue_arn)[1]
      }
      target_group {
        name = split("/", var.target_group_green_arn)[1]
      }
    }
  }
}

# ── CodePipeline ──────────────────────────────────────────────
resource "aws_codepipeline" "main" {
  name     = "${var.project}-pipeline"
  role_arn = var.codepipeline_role_arn

  artifact_store {
    location = var.artifact_bucket_id
    type     = "S3"
  }

  # ── Stage 1: Source — GitHub webhook trigger ─────────────
  stage {
    name = "Source"
    action {
      name             = "GitHub_Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["SourceArtifact"]

      configuration = {
        ConnectionArn        = var.github_connection_arn
        FullRepositoryId     = "${var.github_owner}/${var.github_repo}"
        BranchName           = var.github_branch
        OutputArtifactFormat = "CODE_ZIP"
        DetectChanges        = "true"   # Auto-trigger khi push lên branch
      }
    }
  }

  # ── Stage 2: Build — Docker build + ECR push ─────────────
  stage {
    name = "Build"
    action {
      name             = "Docker_Build_and_Push"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["SourceArtifact"]
      output_artifacts = ["BuildArtifact"]

      configuration = { ProjectName = aws_codebuild_project.main.name }
    }
  }

  # ── Stage 3: Deploy — Blue/Green lên ECS ─────────────────
  stage {
    name = "Deploy"
    action {
      name            = "ECS_BlueGreen_Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CodeDeployToECS"
      version         = "1"
      input_artifacts = ["BuildArtifact"]

      configuration = {
        ApplicationName                = aws_codedeploy_app.main.name
        DeploymentGroupName            = aws_codedeploy_deployment_group.main.deployment_group_name
        TaskDefinitionTemplateArtifact = "BuildArtifact"
        TaskDefinitionTemplatePath     = "taskdef.json"
        AppSpecTemplateArtifact        = "BuildArtifact"
        AppSpecTemplatePath            = "appspec.yml"
        Image1ArtifactName             = "BuildArtifact"
        Image1ContainerName            = "IMAGE_NAME"
      }
    }
  }

  tags = { Name = "${var.project}-pipeline" }
}
