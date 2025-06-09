# Public Hosted zone for your domain
resource "aws_route53_zone" "todo_zone" {
  name    = var.domain_name
  comment = "Hosted Zone for ${var.domain_name}"
  lifecycle {
    prevent_destroy = false
  }
}

# AWS Certificate Manager (ACM) certificate for your domain
resource "aws_acm_certificate" "todo_app_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS" 
  lifecycle {
    prevent_destroy = false 
  }
}

# Route 53 records for ACM certificate DNS validation
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
    prevent_destroy = false 
  }
}

# ACM certificate validation
resource "aws_acm_certificate_validation" "todo_cert_validation" {
  certificate_arn         = aws_acm_certificate.todo_app_cert.arn
  validation_record_fqdns = [for dvo in aws_acm_certificate.todo_app_cert.domain_validation_options : dvo.resource_record_name]

  depends_on = [
    aws_route53_record.cert_validation_record
  ]

  lifecycle {
    prevent_destroy = false 
  }
}

# Secrets Manager for JWT Secret
resource "random_password" "jwt_secret_value" {
  length           = 64
  special          = true
  override_special = "!@#$%^&*()-_=+" 
  min_special      = 1
  min_numeric      = 1
  min_upper        = 1
  min_lower        = 1
}

resource "aws_secretsmanager_secret" "todo_jwt_secret" {
  name                    = "${var.app_name}/jwt_secret"
  description             = "JWT secret for ${var.app_name} authentication"
  recovery_window_in_days = 0 

  tags = {
    Name = "${var.app_name}-JWTSecret"
  }
}

resource "aws_secretsmanager_secret_version" "todo_jwt_secret_version" {
  secret_id     = aws_secretsmanager_secret.todo_jwt_secret.id
  secret_string = jsonencode({
    JWT_SECRET = random_password.jwt_secret_value.result
  })
}