output "console_bucket_id" {
  value       = aws_s3_bucket.console.id
  description = "ID of the console s3 bucket"
}

output "console_bucket_arn" {
  value       = aws_s3_bucket.console.arn
  description = "ARN of the console s3 bucket"
}

output "console_cloudfront_dist_domain" {
  value       = aws_cloudfront_distribution.console.domain_name
  description = "Console Cloudfront distribution URL"
}

output "console_cloudfront_dist_id" {
  value       = aws_cloudfront_distribution.console.id
  description = "Console Cloudfront distribution id"
}

output "locust_alb_dns_name" {
  value       = aws_lb.locust_engine_alb.dns_name
  description = "Locust ALB distribution URL"
}

output "locust_web_target_group" {
  value       = aws_lb_target_group.locust.id
  description = "Locust web target group"
}
