data "archive_file" "locust_artifact" {
  type        = "zip"
  source_dir  = "${abspath(path.module)}/src/engines/locust/"
  output_path = "${abspath(path.module)}/src/locust_container.zip"
}

resource "aws_s3_bucket_object" "locust_artifact" {
  bucket = aws_s3_bucket.artifact.id
  key    = "locust/locust_container.zip"
  source = data.archive_file.locust_artifact.output_path
  etag   = filemd5(data.archive_file.locust_artifact.output_path)
}


resource "aws_codepipeline" "locust_codepipeline" {
  name     = "${var.name}-locust"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifact.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Container"
      category         = "Source"
      owner            = "AWS"
      provider         = "S3"
      version          = "1"
      output_artifacts = ["locust_output"]

      configuration = {
        S3Bucket    = aws_s3_bucket_object.locust_artifact.bucket
        S3ObjectKey = aws_s3_bucket_object.locust_artifact.key
      }
    }

    action {
      name             = "Scenarios"
      category         = "Source"
      owner            = "AWS"
      provider         = "S3"
      version          = "1"
      output_artifacts = ["scenarios_output"]

      configuration = {
        S3Bucket    = aws_s3_bucket.artifact.bucket
        S3ObjectKey = "scenarios/scenarios.zip"
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
      input_artifacts  = ["locust_output", "scenarios_output"]
      output_artifacts = ["locust_build_output"]
      version          = "1"

      configuration = {
        ProjectName   = aws_codebuild_project.containers.name
        PrimarySource = "locust_output"

        EnvironmentVariables = jsonencode([
          {
            name  = "IMAGE_NAME"
            value = "locust"
            type  = "PLAINTEXT"
          },
          {
            name  = "REPOSITORY"
            value = aws_ecr_repository.this.name
            type  = "PLAINTEXT"
          },
          {
            name  = "REPOSITORY_URI"
            value = aws_ecr_repository.this.repository_url
            type  = "PLAINTEXT"
          },
          {
            name  = "CONSOLE_BUCKET_NAME"
            value = var.console_bucket_id
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }
}
