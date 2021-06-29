data "archive_file" "scenarios_artifact" {
  type        = "zip"
  source_dir  = "${abspath(path.module)}/src/scenarios/"
  output_path = "${abspath(path.module)}/src/scenarios.zip"
}

resource "aws_s3_bucket_object" "scenarios_artifact" {
  bucket = aws_s3_bucket.artifact.id
  key    = "scenarios/scenarios.zip"
  source = data.archive_file.scenarios_artifact.output_path
  etag   = filemd5(data.archive_file.scenarios_artifact.output_path)
}

resource "aws_codepipeline" "scenarios_codepipeline" {
  name     = "${var.name}-scenarios"
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
      output_artifacts = ["scenarios_output"]

      configuration = {
        S3Bucket    = aws_s3_bucket_object.scenarios_artifact.bucket
        S3ObjectKey = aws_s3_bucket_object.scenarios_artifact.key
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
      input_artifacts  = ["scenarios_output"]
      output_artifacts = ["scenarios_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.scenarios.name

        EnvironmentVariables = jsonencode([
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
