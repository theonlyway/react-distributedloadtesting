resource "aws_lb_target_group" "locust" {
  name_prefix          = "web"
  port                 = 8089
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = var.vpc_id
  deregistration_delay = 10
}
