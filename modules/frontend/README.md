## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| aws | n/a |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| allowed\_ips | List of allowed IPs | `list(map(string))` | `[]` | no |
| geo\_loc\_whitelist | List of countries to whitelist | `list(string)` | `[]` | no |
| kms\_key\_arn | KMS key arn | `string` | n/a | yes |
| name | Name of the solution | `string` | n/a | yes |
| vpc\_id | ID of the VPC | `string` | n/a | yes |
| vpc\_public\_subnets | List of public subnets | `list` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| console\_bucket\_arn | ARN of the console s3 bucket |
| console\_bucket\_id | ID of the console s3 bucket |
| console\_cloudfront\_dist\_domain | Console Cloudfront distribution URL |
| console\_cloudfront\_dist\_id | Console Cloudfront distribution id |
| locust\_alb\_dns\_name | Locust ALB distribution URL |
| locust\_web\_target\_group | Locust web target group |
