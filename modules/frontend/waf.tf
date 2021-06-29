resource "aws_waf_ipset" "office_ip" {
  name = "Office_IP_Set"


  dynamic "ip_set_descriptors" {
    for_each = var.allowed_ips
    content {
      type  = ip_set_descriptors.value.type
      value = ip_set_descriptors.value.value
    }
  }
}

resource "aws_waf_rule" "office_ip" {
  depends_on  = [aws_waf_ipset.office_ip]
  name        = "OfficeIPMatch${var.name}"
  metric_name = "OfficeIPMatch${var.name}"

  predicates {
    data_id = aws_waf_ipset.office_ip.id
    negated = false
    type    = "IPMatch"
  }
}

resource "aws_waf_web_acl" "console" {
  depends_on  = [aws_waf_ipset.office_ip, aws_waf_rule.office_ip]
  name        = "${var.name}WebACL"
  metric_name = "${var.name}WebACL"

  default_action {
    type = "BLOCK"
  }

  rules {
    action {
      type = "ALLOW"
    }

    priority = 1
    rule_id  = aws_waf_rule.office_ip.id
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_wafregional_ipset" "office_ip" {
  name = "Office_IP_Set"

  dynamic "ip_set_descriptor" {
    for_each = var.allowed_ips
    content {
      type  = ip_set_descriptor.value.type
      value = ip_set_descriptor.value.value
    }
  }
}

resource "aws_wafregional_rule" "office_ip" {
  depends_on  = [aws_wafregional_ipset.office_ip]
  name        = "OfficeIPMatch${var.name}"
  metric_name = "OfficeIPMatch${var.name}"

  predicate {
    data_id = aws_wafregional_ipset.office_ip.id
    negated = false
    type    = "IPMatch"
  }
}

resource "aws_wafregional_web_acl" "console" {
  depends_on  = [aws_wafregional_ipset.office_ip, aws_wafregional_rule.office_ip]
  name        = "${var.name}WebACL"
  metric_name = "${var.name}WebACL"

  default_action {
    type = "BLOCK"
  }

  rule {
    action {
      type = "ALLOW"
    }

    priority = 1
    rule_id  = aws_wafregional_rule.office_ip.id
  }

  lifecycle {
    create_before_destroy = true
  }
}
