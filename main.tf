module "frontend" {
  source = "./modules/frontend"

  name               = var.name
  kms_key_arn        = aws_kms_key.this.arn
  vpc_public_subnets = module.backend.vpc_public_subnets
  vpc_id             = module.backend.vpc_id
  allowed_ips        = local.allowed_ips
  geo_loc_whitelist  = var.geo_loc_whitelist
}

module "backend" {
  source = "./modules/backend"

  name                           = var.name
  vpc_cidr                       = var.vpc_cidr
  vpc_public_subnet_cidrs        = var.vpc_public_subnet_cidrs
  vpc_private_subnet_cidrs       = var.vpc_private_subnet_cidrs
  kms_key_arn                    = aws_kms_key.this.arn
  kms_key_id                     = aws_kms_key.this.id
  console_bucket_id              = module.frontend.console_bucket_id
  console_bucket_arn             = module.frontend.console_bucket_arn
  console_cloudfront_dist_domain = module.frontend.console_cloudfront_dist_domain
  initial_admin_account_name     = var.initial_admin_account_name
  initial_admin_email_address    = var.initial_admin_email_address
  locust_alb_dns_name            = module.frontend.locust_alb_dns_name
  locust_web_target_group        = module.frontend.locust_web_target_group
  console_cloudfront_dist_id     = module.frontend.console_cloudfront_dist_id
  aws_cli_profile_name           = var.aws_cli_profile_name
  public_ips_for_slaves          = var.public_ips_for_slaves
}
