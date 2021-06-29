data "archive_file" "console_artifact" {
  type        = "zip"
  source_dir  = "${abspath(path.module)}/src/dlt-console/"
  output_path = "${abspath(path.module)}/src/console.zip"
}

resource "aws_s3_bucket_object" "console_artifact" {
  bucket = aws_s3_bucket.artifact.id
  key    = "dlt-console/console.zip"
  source = data.archive_file.console_artifact.output_path
  etag   = filemd5(data.archive_file.console_artifact.output_path)
}

resource "aws_codepipeline" "console_codepipeline" {
  name     = "${var.name}-console"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifact.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "S3"
      version          = "1"
      output_artifacts = ["dlt_console_output"]

      configuration = {
        S3Bucket    = aws_s3_bucket_object.console_artifact.bucket
        S3ObjectKey = aws_s3_bucket_object.console_artifact.key
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["dlt_console_output"]
      output_artifacts = ["dlt_console_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.dlt_console.name

        EnvironmentVariables = jsonencode([
          {
            name  = "LOAD_TESTING_NAME"
            value = var.name
            type  = "PLAINTEXT"
          },
          {
            name  = "CONSOLE_BUCKET_NAME"
            value = var.console_bucket_id
            type  = "PLAINTEXT"
          },
          {
            name  = "ARTIFACT_BUCKET_NAME"
            value = aws_s3_bucket.artifact.id
            type  = "PLAINTEXT"
          },
          {
            name  = "AWS_CONGITO_IDENTITY_POOL_ID"
            value = aws_cognito_identity_pool.console.id
            type  = "PLAINTEXT"
          },
          {
            name  = "AWS_USER_POOLS_ID"
            value = aws_cognito_user_pool.console.id
            type  = "PLAINTEXT"
          },
          {
            name  = "AWS_USER_POOLS_WEB_CLIENT_ID"
            value = aws_cognito_user_pool_client.console.id
            type  = "PLAINTEXT"
          },
          {
            name  = "API_ENDPOINT"
            value = aws_api_gateway_stage.console.invoke_url
            type  = "PLAINTEXT"
          },
          {
            name  = "LOCUST_ALB_DNS"
            value = var.locust_alb_dns_name
            type  = "PLAINTEXT"
          },
          {
            name  = "CONSOLE_CLOUDFRONT_DIST_ID"
            value = var.console_cloudfront_dist_id
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }
}
