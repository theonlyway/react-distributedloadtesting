resource "aws_api_gateway_rest_api" "console" {
  name        = var.name
  description = "API for Distributed load testing"
  body = templatefile("${abspath(path.module)}/swagger.yaml", {
    gateway_name       = var.name
    description        = "API for Distributed load testing"
    engines_lambda_arn = aws_lambda_function.engines_lambda.invoke_arn
  })

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "console" {
  depends_on  = [aws_api_gateway_rest_api.console]
  rest_api_id = aws_api_gateway_rest_api.console.id
  stage_name  = ""

  variables = {
    api_body_md5 = md5(file("${abspath(path.module)}/swagger.yaml"))
  }

  lifecycle {
    create_before_destroy = "true"
  }
}

resource "aws_api_gateway_stage" "console" {
  stage_name    = "console"
  rest_api_id   = aws_api_gateway_rest_api.console.id
  deployment_id = aws_api_gateway_deployment.console.id
}
