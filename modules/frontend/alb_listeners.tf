resource "aws_lb_listener" "locust_master" {
  load_balancer_arn = aws_lb.locust_engine_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.locust.arn
  }
}
