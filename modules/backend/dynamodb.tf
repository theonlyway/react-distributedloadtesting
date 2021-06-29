resource "aws_dynamodb_table" "engine_deployments" {
  name         = "${var.name}-engine-deployments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "engine_type"

  attribute {
    name = "engine_type"
    type = "S"
  }
}
