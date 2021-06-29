/*
════════════════════███████
═══════════════════█████████
══════════════════███████████
═════════════════███░░███░░███
════════════════███░░░░█░░░░░██
════════════█████░░░███████░░░████
═══════════█░░░████░█░█░█░█░███░░░█
═══════════█░░░███░░███░███░░██░░░█
═════════███░░░███░░░░░░░░░░░██░░░███
═════════█████░░░░░░░░███░░░░░░░█████
═══════██████░░░░░░░░░░░░░░░░░░░░██████
══════███████░░░░█████████████░░░███████
═══██████████░░░█░░░░░░░░░░░░░█░░████████
══██████████████░░░░░░░░░░░░░░░██████████
═███████████████░░░░░░░░░░░░░░░███████████
═█████████████████░░░░░░░░░░░░█████████████
═██████████████████░░░░░░░░░░██████████████
═██████████████████████████████████████████
═██████████████░░░██████████░░░████████████
══█████████████░░░░░░████░░░░░░████████████
═══█████████████░█░░░░██░░░░█░████████████
════█████████████░░░░░██░░░░░████████████
══════██████████░█░░░░██░░░░█░██████████
════════████████░█░░░░░░░░░░█░████████
═══════████████░░░░░░█░░█░░░░░░████████
═══════██████████████░░░░██████████████
══════███████████░░░░░░░░░░░░███████████
════█████████████░░░░█░█░░░░░████████████
═══███████████████░░█░█░█░░░██████████████
═══███████████████████████████████████████
═══███████████████████████████████████████
═══████████████████════════███████████████
════█████████████════════════████████████
════████████████══════════════███████████
═████░░███░░░██═══════════════██░░░███░░████
█░░░░░█░░░░██░█═══════════════█░██░░░░█░░░░░█
██████████████═════════════════██████████████
*/
data "aws_iam_account_alias" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_cognito_user_pool" "console" {
  name = var.name

  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_message = "<p>Your username is <strong>{username}</strong> and temporary password is <strong>{####}</strong></p><p>Console: <strong>https://${var.console_cloudfront_dist_domain}/</strong></p><p>Please give the console about 5-10 minutes to load as it's been provisioned in the background by codepipeline/build</p>"
      email_subject = "Welcome to Distributed Load Testing for account: ${data.aws_caller_identity.current.account_id} - ${data.aws_iam_account_alias.current.account_alias}"
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      max_length = "2048"
      min_length = "0"
    }
  }
  alias_attributes           = ["email"]
  auto_verified_attributes   = ["email"]
  email_verification_subject = "Your Distribution Load Testing console verification code"
  email_verification_message = "Your Distribution Load Testing console verification code is <strong>{####}</strong>"
}

resource "aws_cognito_user_pool_client" "console" {
  name = "${var.name}-app"

  user_pool_id           = aws_cognito_user_pool.console.id
  refresh_token_validity = 1
  generate_secret        = false
  write_attributes       = ["address", "email", "phone_number"]
}


 

resource "aws_cognito_identity_pool" "console" {
  identity_pool_name               = var.name
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.console.id
    provider_name           = "cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.console.id}"
    server_side_token_check = false
  }
}

resource "aws_cognito_identity_pool_roles_attachment" "console" {
  identity_pool_id = aws_cognito_identity_pool.console.id

  roles = {
    "authenticated"   = aws_iam_role.cognito_authorized.arn
    "unauthenticated" = aws_iam_role.cognito_unauthorized.arn
  }
}


resource "null_resource" "console_admin_user" {
  triggers = {
    user_pool_id = aws_cognito_user_pool.console.id
  }

  provisioner "local-exec" {
    command = var.aws_cli_profile_name != "" ? "aws cognito-idp admin-create-user --user-pool-id ${aws_cognito_user_pool.console.id} --username ${var.initial_admin_account_name} --user-attributes Name=email,Value=${var.initial_admin_email_address} Name=email_verified,Value='True' --profile ${var.aws_cli_profile_name}" : "aws cognito-idp admin-create-user --user-pool-id ${aws_cognito_user_pool.console.id} --username ${var.initial_admin_account_name} --user-attributes Name=email,Value=${var.initial_admin_email_address} Name=email_verified,Value='True'"
  }
}
