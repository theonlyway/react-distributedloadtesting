variable "name" {
  type        = string
  default     = "DistributedLoadTesting"
  description = "Name of the solution"
}

variable "initial_admin_account_name" {
  type        = string
  description = "Default admin username for initial login to Cognito"
  default     = "Admin"
}

variable "initial_admin_email_address" {
  type        = string
  description = "Default email address for initial login to Cognito. Initial login details will be sent here"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC"
  default     = "192.168.0.0/16"
  type        = string
}

variable "vpc_public_subnet_cidrs" {
  description = "List of CIDRs to be used for public subnets"
  type        = list
  default     = ["192.168.1.0/24", "192.168.2.0/24", "192.168.3.0/24"]

}

variable "vpc_private_subnet_cidrs" {
  description = "List of CIDRs to be used for private subnets"
  type        = list
  default     = ["192.168.4.0/24", "192.168.5.0/24", "192.168.6.0/24"]
}

variable "public_ips_for_slaves" {
  description = "Flag for weather or not to assign public IP's to slaves. This will give that each slave is coming from a different IP address as opposed to routing traffic out of the 3 known NAT gateways"
  type        = bool
  default     = false
}

locals {
  allowed_ips = [
    {
      type  = "IPV4"
      value = "8.8.8.8/32"
    }
  ]
}

variable "geo_loc_whitelist" {
  type        = list(string)
  description = "List of countries to whitelist"
  default     = ["AU"]
}

variable "aws_cli_profile_name" {
  type        = string
  description = "AWS CLI profile to use for credentials if not using the default"
  default     = "aws-237"
}
