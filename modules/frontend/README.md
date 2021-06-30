## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_cloudfront_distribution.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution) | resource |
| [aws_cloudfront_origin_access_identity.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_origin_access_identity) | resource |
| [aws_lb.locust_engine_alb](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb) | resource |
| [aws_lb_listener.locust_master](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb_listener) | resource |
| [aws_lb_target_group.locust](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb_target_group) | resource |
| [aws_s3_bucket.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) | resource |
| [aws_s3_bucket_policy.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_policy) | resource |
| [aws_s3_bucket_public_access_block.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) | resource |
| [aws_security_group.engine_alb](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group) | resource |
| [aws_waf_ipset.office_ip](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/waf_ipset) | resource |
| [aws_waf_rule.office_ip](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/waf_rule) | resource |
| [aws_waf_web_acl.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/waf_web_acl) | resource |
| [aws_wafregional_ipset.office_ip](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/wafregional_ipset) | resource |
| [aws_wafregional_rule.office_ip](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/wafregional_rule) | resource |
| [aws_wafregional_web_acl.console](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/wafregional_web_acl) | resource |
| [aws_wafregional_web_acl_association.alb_waf](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/wafregional_web_acl_association) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_allowed_ips"></a> [allowed\_ips](#input\_allowed\_ips) | List of allowed IPs | `list(map(string))` | `[]` | no |
| <a name="input_geo_loc_whitelist"></a> [geo\_loc\_whitelist](#input\_geo\_loc\_whitelist) | List of countries to whitelist | `list(string)` | `[]` | no |
| <a name="input_kms_key_arn"></a> [kms\_key\_arn](#input\_kms\_key\_arn) | KMS key arn | `string` | n/a | yes |
| <a name="input_name"></a> [name](#input\_name) | Name of the solution | `string` | n/a | yes |
| <a name="input_vpc_id"></a> [vpc\_id](#input\_vpc\_id) | ID of the VPC | `string` | n/a | yes |
| <a name="input_vpc_public_subnets"></a> [vpc\_public\_subnets](#input\_vpc\_public\_subnets) | List of public subnets | `list` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_console_bucket_arn"></a> [console\_bucket\_arn](#output\_console\_bucket\_arn) | ARN of the console s3 bucket |
| <a name="output_console_bucket_id"></a> [console\_bucket\_id](#output\_console\_bucket\_id) | ID of the console s3 bucket |
| <a name="output_console_cloudfront_dist_domain"></a> [console\_cloudfront\_dist\_domain](#output\_console\_cloudfront\_dist\_domain) | Console Cloudfront distribution URL |
| <a name="output_console_cloudfront_dist_id"></a> [console\_cloudfront\_dist\_id](#output\_console\_cloudfront\_dist\_id) | Console Cloudfront distribution id |
| <a name="output_locust_alb_dns_name"></a> [locust\_alb\_dns\_name](#output\_locust\_alb\_dns\_name) | Locust ALB distribution URL |
| <a name="output_locust_web_target_group"></a> [locust\_web\_target\_group](#output\_locust\_web\_target\_group) | Locust web target group |
