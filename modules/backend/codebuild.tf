resource "aws_iam_role" "codebuild" {
  name = "${var.name}-CodeBuild"

  assume_role_policy = <<-EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "codebuild_cloudwatch" {
  role       = aws_iam_role.codebuild.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.name}-CodeBuild"
  role = aws_iam_role.codebuild.id

  policy = <<-EOF
{
    "Statement": [
        {
            "Action": [
                "ecr:DescribeImages",
                "ecr:PutImage",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:InitiateLayerUpload",
                "ecr:GetDownloadUrlForLayer",
                "ecr:ListImages",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetRepositoryPolicy"
            ],
            "Resource": [
                "${aws_ecr_repository.this.arn}"
            ],
            "Effect": "Allow"
        },
        {
            "Action": [
                "ecr:GetAuthorizationToken",
                "cloudfront:CreateInvalidation"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning",
                "s3:GetObjectVersion",
                "s3:ListBucketVersions",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "${aws_s3_bucket.artifact.arn}",
                "${aws_s3_bucket.artifact.arn}/*",
                "${var.console_bucket_arn}",
                "${var.console_bucket_arn}/*"
            ],
            "Effect": "Allow"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "${aws_s3_bucket.artifact.arn}",
                "${var.console_bucket_arn}"
            ]
        }
    ]
}
  EOF
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name = "${var.name}-codebuild"
}

resource "aws_codebuild_project" "containers" {
  name          = "${var.name}-containers"
  description   = "Builds distributed load testing suite containers"
  build_timeout = "20"
  service_role  = aws_iam_role.codebuild.arn

  encryption_key = var.kms_key_arn
  artifacts {
    type = "CODEPIPELINE"
  }

  logs_config {
    cloudwatch_logs {
      status      = "ENABLED"
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "log-stream"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:4.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = file("${abspath(path.module)}/codepipeline_buildspec_containers.yaml")
  }
}

resource "aws_codebuild_project" "dlt_console" {
  name          = "${var.name}-console"
  description   = "Builds and deploys the distributed load test console"
  build_timeout = "20"
  service_role  = aws_iam_role.codebuild.arn

  encryption_key = var.kms_key_arn
  artifacts {
    type = "CODEPIPELINE"
  }

  logs_config {
    cloudwatch_logs {
      status      = "ENABLED"
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "log-stream"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:4.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = file("${abspath(path.module)}/codepipeline_buildspec_console.yaml")
  }
}

resource "aws_codebuild_project" "scenarios" {
  name          = "${var.name}-scenarios"
  description   = "Deploys the default set of test scenarios for engines"
  build_timeout = "20"
  service_role  = aws_iam_role.codebuild.arn

  encryption_key = var.kms_key_arn
  artifacts {
    type = "CODEPIPELINE"
  }

  logs_config {
    cloudwatch_logs {
      status      = "ENABLED"
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "log-stream"
    }

    s3_logs {
      status = "DISABLED"
    }
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:4.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = file("${abspath(path.module)}/codepipeline_buildspec_scenarios.yaml")
  }
}
