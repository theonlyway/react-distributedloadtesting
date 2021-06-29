resource "aws_iam_role" "console_api" {
  name = "${var.name}-Lambda-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "console_api" {
  name = "${var.name}-Lambda-role"
  role = aws_iam_role.console_api.id

  policy = <<-EOF
{
    "Statement": [
        {
            "Action": [
                "dynamodb:*"
            ],
            "Resource": [
                "${aws_dynamodb_table.engine_deployments.arn}"
            ],
            "Effect": "Allow"
        },
        {
            "Action": [
                "sqs:*"
            ],
            "Resource": [
                "${aws_sqs_queue.launch_engines.arn}",
                "${aws_sqs_queue.delete_engines.arn}"
            ],
            "Effect": "Allow"
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": "${var.kms_key_arn}"
        },
        {
            "Effect": "Allow",
            "Action": "pricing:*",
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:ListTasks",
                "ecs:DescribeTasks",
                "ecs:DescribeServices",
                "ecs:ListTaskDefinitions",
                "ecs:DeRegisterTaskDefinition"

            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
            "${aws_iam_role.execution_role.arn}",
            "${aws_iam_role.task_role.arn}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecs:CreateService",
                "ecs:DeleteService"
            ],
            "Resource": [
            "${aws_ecs_cluster.locust.arn}",
            "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.locust.name}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "codepipeline:StartPipelineExecution",
                "codepipeline:GetPipelineExecution"
            ],
            "Resource": [
            "${aws_codepipeline.locust_codepipeline.arn}"
            ]
        }
    ]
}
  EOF
}

resource "aws_iam_role_policy_attachment" "console_api" {
  role       = aws_iam_role.console_api.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "engines_lambda" {
  type        = "zip"
  source_dir  = "${abspath(path.module)}/src/lambda/engines"
  output_path = "${abspath(path.module)}/src/lambda_engines.zip"
}

resource "aws_cloudwatch_log_group" "engines_lambda" {
  name = "/aws/lambda/${aws_lambda_function.engines_lambda.function_name}"
}

resource "aws_lambda_function" "engines_lambda" {
  filename      = data.archive_file.engines_lambda.output_path
  function_name = "${var.name}-api-engines"
  role          = aws_iam_role.console_api.arn
  handler       = "engines.lambda_handler"
  runtime       = "python3.8"
  timeout       = 30
  memory_size   = 128

  source_code_hash = filebase64sha256(data.archive_file.engines_lambda.output_path)

  environment {
    variables = {
      LOGGING_LEVEL                     = "INFO"
      ENGINE_DEPLOYMENTS_DYNAMODB_TABLE = aws_dynamodb_table.engine_deployments.id
      ECR_URL                           = aws_ecr_repository.this.repository_url
      LOCUST_ECS_NAME                   = aws_ecs_cluster.locust.name
      LAUNCH_SQS_QUEUE_URL              = aws_sqs_queue.launch_engines.id
      DELETE_SQS_QUEUE_URL              = aws_sqs_queue.delete_engines.id
    }
  }
}

resource "aws_lambda_permission" "engines_api_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.engines_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.console.execution_arn}/*/*/*"
}

resource "aws_cloudwatch_log_group" "launch_engines_lambda" {
  name = "/aws/lambda/${aws_lambda_function.launch_engines_lambda.function_name}"
}

resource "aws_lambda_function" "launch_engines_lambda" {
  filename      = data.archive_file.engines_lambda.output_path
  function_name = "${var.name}-launch-engines"
  role          = aws_iam_role.console_api.arn
  handler       = "launch.lambda_handler"
  runtime       = "python3.8"
  timeout       = 240
  memory_size   = 128

  source_code_hash = filebase64sha256(data.archive_file.engines_lambda.output_path)

  environment {
    variables = {
      LOGGING_LEVEL                     = "INFO"
      ENGINE_DEPLOYMENTS_DYNAMODB_TABLE = aws_dynamodb_table.engine_deployments.id
      ECR_URL                           = aws_ecr_repository.this.repository_url
      ECS_TASK_ROLE                     = aws_iam_role.task_role.arn
      ECS_EXECUTION_ROLE                = aws_iam_role.execution_role.arn
      LOCUST_ECS_NAME                   = aws_ecs_cluster.locust.name
      LOCUST_WEB_TARGETGROUP            = var.locust_web_target_group
      LOCUST_PIPELINE_NAME              = aws_codepipeline.locust_codepipeline.name
      PRIVATE_SUBNETS                   = join(", ", aws_subnet.this_private.*.id)
      ECS_LOG_GROUP                     = aws_cloudwatch_log_group.ecs.name
      CONTAINER_SECURTY_GROUP           = aws_security_group.allow_container.id
      LAUNCH_SQS_QUEUE_URL              = aws_sqs_queue.launch_engines.id
      SLAVE_PUBLIC_IP                   = var.public_ips_for_slaves == false ? "DISABLED" : "ENABLED"
    }
  }
}

resource "aws_cloudwatch_log_group" "delete_engines_lambda" {
  name = "/aws/lambda/${aws_lambda_function.delete_engines_lambda.function_name}"
}

resource "aws_lambda_function" "delete_engines_lambda" {
  filename      = data.archive_file.engines_lambda.output_path
  function_name = "${var.name}-delete-engines"
  role          = aws_iam_role.console_api.arn
  handler       = "delete.lambda_handler"
  runtime       = "python3.8"
  timeout       = 30
  memory_size   = 128

  source_code_hash = filebase64sha256(data.archive_file.engines_lambda.output_path)

  environment {
    variables = {
      LOGGING_LEVEL                     = "INFO"
      ENGINE_DEPLOYMENTS_DYNAMODB_TABLE = aws_dynamodb_table.engine_deployments.id
      ECR_URL                           = aws_ecr_repository.this.repository_url
      LOCUST_ECS_NAME                   = aws_ecs_cluster.locust.name
      LAUNCH_SQS_QUEUE_URL              = aws_sqs_queue.launch_engines.id
    }
  }
}

resource "aws_lambda_event_source_mapping" "launch_engines_lambda" {
  depends_on       = [aws_iam_role_policy.console_api]
  event_source_arn = aws_sqs_queue.launch_engines.arn
  function_name    = aws_lambda_function.launch_engines_lambda.arn
}

resource "aws_lambda_event_source_mapping" "delete_engines_lambda" {
  depends_on       = [aws_iam_role_policy.console_api]
  event_source_arn = aws_sqs_queue.delete_engines.arn
  function_name    = aws_lambda_function.delete_engines_lambda.arn
}
