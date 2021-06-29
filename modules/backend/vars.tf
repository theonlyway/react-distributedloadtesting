variable "vpc_cidr" {
  description = "CIDR for the Fargate VPC"
  type        = string
}

variable "name" {
  type        = string
  description = "Name of the solution"
}

variable "vpc_public_subnet_cidrs" {
  type        = list
  description = "List of public subnets"
}

variable "vpc_private_subnet_cidrs" {
  type        = list
  description = "List of private subnets"
}

variable "kms_key_arn" {
  type        = string
  description = "KMS key arn"
}

variable "kms_key_id" {
  description = "KMS key id"
  type        = string
}

variable "console_bucket_id" {
  type        = string
  description = "ID of the console bucket"
}

variable "console_bucket_arn" {
  type        = string
  description = "ARN of the console bucket"
}

variable "console_cloudfront_dist_domain" {
  type        = string
  description = "Domain name of the console cloudfront distribution"
}

variable "console_cloudfront_dist_id" {
  type        = string
  description = "Console Cloudfront distribution id"
}

variable "initial_admin_account_name" {
  type        = string
  description = "Default admin username for initial login to Cognito"
}

variable "initial_admin_email_address" {
  type        = string
  description = "Default email address for initial login to Cognito. Initial password will be sent here"
}

variable "locust_alb_dns_name" {
  type        = string
  description = "DNS name of the engine ALB"
}

variable "locust_web_target_group" {
  type        = string
  description = "Locust web target group"
}

variable "aws_cli_profile_name" {
  type        = string
  description = "AWS CLI profile to use for credentials if not using the default"
}

variable "public_ips_for_slaves" {
  description = "Flag for weather or not to assign public IP's to slaves. This will make it look like each slave is coming from a different IP address as opposed to routing traffic out of the 3 known NAT gateways"
  type        = bool
}
