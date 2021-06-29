output "vpc_public_subnets" {
  value       = concat(aws_subnet.this_public.*.id)
  description = "List of public subnets"
}

output "vpc_id" {
  value       = aws_vpc.this.id
  description = "VPC ID"
}

output "nat_ip_addresses" {
  value       = var.public_ips_for_slaves == false ? aws_nat_gateway.this.*.public_ip : []
  description = "List of public IP addresses assigned to the NAT gateways"
}
