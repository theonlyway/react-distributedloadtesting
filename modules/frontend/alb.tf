resource "aws_lb" "locust_engine_alb" {
  name               = "${var.name}-locust"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.engine_alb.id]
  subnets            = var.vpc_public_subnets

}

resource "aws_security_group" "engine_alb" {
  name        = "${var.name}-alb"
  description = "Allow inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_wafregional_web_acl_association" "alb_waf" {
  resource_arn = aws_lb.locust_engine_alb.arn
  web_acl_id   = aws_wafregional_web_acl.console.id
}
