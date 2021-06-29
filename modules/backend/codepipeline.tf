resource "aws_iam_role" "codepipeline" {
  name = "${var.name}-CodePipeline"

  assume_role_policy = <<-EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "codepipeline_cloudwatch" {
  role       = aws_iam_role.codepipeline.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "${var.name}-CodePipeline"
  role = aws_iam_role.codepipeline.id

  policy = <<-EOF
{
    "Statement": [
        {
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning",
                "s3:ListBucketVersions",
                "s3:PutObject"
            ],
            "Resource": [
                "${aws_s3_bucket.artifact.arn}",
                "${aws_s3_bucket.artifact.arn}/*"
            ],
            "Effect": "Allow"
        },
        {
            "Action": [
                "codebuild:StartBuild",
                "codebuild:BatchGetBuilds"
            ],
            "Resource": [
                "${aws_codebuild_project.containers.id}",
                "${aws_codebuild_project.dlt_console.id}",
                "${aws_codebuild_project.scenarios.id}"

            ],
            "Effect": "Allow"
        }
    ]
}
  EOF
}
