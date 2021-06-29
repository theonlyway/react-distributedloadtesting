variable "name" {
  type        = string
  description = "Name of the solution"
}

variable "kms_key_arn" {
  type        = string
  description = "KMS key arn"
}

variable "vpc_public_subnets" {
  type        = list
  description = "List of public subnets"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC"
}

variable "allowed_ips" {
  description = "List of allowed IPs"
  default     = []
  type        = list(map(string))
}

variable "geo_loc_whitelist" {
  type        = list(string)
  description = "List of countries to whitelist"
  default     = []
}
