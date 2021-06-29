provider "aws" {
  region  = "ap-southeast-2"
  profile = var.aws_cli_profile_name
}

provider "aws" {
  # us-east-1 instance
  region = "us-east-1"
  alias  = "use1"
}
