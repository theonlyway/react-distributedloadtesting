resource "aws_cloudfront_origin_access_identity" "console" {
  comment = "Origin access identity for ${var.name}"
}

resource "aws_cloudfront_distribution" "console" {
  web_acl_id = aws_waf_web_acl.console.id
  origin {
    domain_name = aws_s3_bucket.console.bucket_regional_domain_name
    origin_id   = aws_s3_bucket.console.id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.console.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Cloudfront distribution for ${var.name}"
  default_root_object = "index.html"

  aliases = []

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.console.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.geo_loc_whitelist
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
  }

  custom_error_response {
    error_code            = "404"
    response_code         = "200"
    response_page_path    = "/index.html"
    error_caching_min_ttl = "300"
  }

  custom_error_response {
    error_code            = "403"
    response_code         = "200"
    response_page_path    = "/index.html"
    error_caching_min_ttl = "300"
  }
}
