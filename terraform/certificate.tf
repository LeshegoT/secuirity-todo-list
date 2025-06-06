# Public Hosted zone
resource "aws_route53_zone" "todo_zone" {
  name    = var.domain_name
  comment = "Hosted Zone for ${var.domain_name}"
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_acm_certificate" "todo_app_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_record" "cert_validation_record" {
  for_each = {
    for dvo in aws_acm_certificate.todo_app_cert.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  name    = each.value.name
  records = [each.value.record]
  ttl     = 60
  type    = each.value.type
  zone_id = aws_route53_zone.todo_zone.zone_id

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_acm_certificate_validation" "todo_cert_validation" {
  certificate_arn         = aws_acm_certificate.todo_app_cert.arn
  validation_record_fqdns = [for dvo in aws_acm_certificate.todo_app_cert.domain_validation_options : dvo.resource_record_name]
  
  depends_on = [
    aws_route53_record.cert_validation_record
  ]

  lifecycle {
    prevent_destroy = true
  }
}