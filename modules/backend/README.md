## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| archive | n/a |
| aws | n/a |
| null | n/a |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| aws\_cli\_profile\_name | AWS CLI profile to use for credentials if not using the default | `string` | n/a | yes |
| console\_bucket\_arn | ARN of the console bucket | `string` | n/a | yes |
| console\_bucket\_id | ID of the console bucket | `string` | n/a | yes |
| console\_cloudfront\_dist\_domain | Domain name of the console cloudfront distribution | `string` | n/a | yes |
| console\_cloudfront\_dist\_id | Console Cloudfront distribution id | `string` | n/a | yes |
| initial\_admin\_account\_name | Default admin username for initial login to Cognito | `string` | n/a | yes |
| initial\_admin\_email\_address | Default email address for initial login to Cognito. Initial password will be sent here | `string` | n/a | yes |
| kms\_key\_arn | KMS key arn | `string` | n/a | yes |
| kms\_key\_id | KMS key id | `string` | n/a | yes |
| locust\_alb\_dns\_name | DNS name of the engine ALB | `string` | n/a | yes |
| locust\_web\_target\_group | Locust web target group | `string` | n/a | yes |
| name | Name of the solution | `string` | n/a | yes |
| public\_ips\_for\_slaves | Flag for weather or not to assign public IP's to slaves. This will make it look like each slave is coming from a different IP address as opposed to routing traffic out of the 3 known NAT gateways | `bool` | n/a | yes |
| vpc\_cidr | CIDR for the Fargate VPC | `string` | n/a | yes |
| vpc\_private\_subnet\_cidrs | List of private subnets | `list` | n/a | yes |
| vpc\_public\_subnet\_cidrs | List of public subnets | `list` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| nat\_ip\_addresses | List of public IP addresses assigned to the NAT gateways |
| vpc\_id | VPC ID |
| vpc\_public\_subnets | List of public subnets |
