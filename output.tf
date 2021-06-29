output "nat_ip_addresses" {
  value       = module.backend.nat_ip_addresses
  description = "List of public IP addresses assigned to the NAT gateways"
}
