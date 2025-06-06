# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "todo_app" {
  name        = var.app_name
  description = "Elastic Beanstalk application for ${var.app_name}"

  tags = {
    Name = var.app_name
  }
}

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
  name                  = "${var.app_name}/jwt_secret"
  description           = "JWT secret for ${var.app_name} authentication"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.app_name}-JWTSecret"
  }
}

resource "aws_secretsmanager_secret_version" "todo_jwt_secret_version" {
  secret_id = aws_secretsmanager_secret.todo_jwt_secret.id
  secret_string = jsonencode({
    JWT_SECRET = random_password.jwt_secret_value.result
  })
}

resource "aws_elastic_beanstalk_application_version" "todo_app_initial" {
  name        = "initial-version"
  application = aws_elastic_beanstalk_application.todo_app.name
  description = "Initial empty app version"
  bucket      = aws_s3_object.empty_app.bucket # Assuming aws_s3_object.empty_app is defined elsewhere
  key         = aws_s3_object.empty_app.key

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_s3_object.empty_app # Assuming aws_s3_object.empty_app is defined elsewhere
  ]
}

resource "aws_elastic_beanstalk_environment" "todo_env" {
  name                = var.env_name
  application         = aws_elastic_beanstalk_application.todo_app.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.5.2 running Node.js 22"
  tier                = "WebServer"
  version_label       = aws_elastic_beanstalk_application_version.todo_app_initial.name

  # Instance Configuration
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = "t3.micro"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.todo_eb_instance_profile.name
  }

  # VPC Configuration
  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = aws_vpc.todo_vpc.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", [for s in aws_subnet.todo_private_subnets : s.id])
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = join(",", [for s in aws_subnet.todo_public_subnets : s.id])
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "false"
  }

  # Security Groups
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = aws_security_group.todo_eb_sg.id
  }

  setting {
    namespace = "aws:elbv2:loadbalancer"
    name      = "SecurityGroups"
    value     = aws_security_group.todo_alb_sg.id
  }

  # Service Role
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.todo_eb_service_role.name
  }

  # Load Balancer Configuration
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  # Enhanced Health Reporting
  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "enhanced"
  }

  # Environment Variables
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = "production"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PG_HOST"
    value     = aws_db_instance.todo_postgres.address
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PG_DATABASE"
    value     = var.db_name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PG_PORT"
    value     = tostring(var.db_port)
  }

  # AWS-managed master user secret
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PG_USER"
    value     = "{{resolve:secretsmanager:${aws_db_instance.todo_postgres.master_user_secret[0].secret_arn}:SecretString:username}}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PG_PASSWORD"
    value     = "{{resolve:secretsmanager:${aws_db_instance.todo_postgres.master_user_secret[0].secret_arn}:SecretString:password}}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_SECRET_ARN"
    value     = aws_db_instance.todo_postgres.master_user_secret[0].secret_arn
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "HEALTH_CHECK_URL"
    value     = "/api/health"
  }

  # Inject JWT Secret from Secrets Manager
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "JWT_SECRET"
    value     = "{{resolve:secretsmanager:${aws_secretsmanager_secret.todo_jwt_secret.name}:SecretString:JWT_SECRET}}"
  }

  # ALB HTTPS Listener Configuration
  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "ListenerEnabled"
    value     = "true"
  }

  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "Protocol"
    value     = "HTTPS"
  }

  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "SSLCertificateArns"
    value     = aws_acm_certificate.todo_app_cert.arn
  }

  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "SSLPolicy"
    value     = "ELBSecurityPolicy-2016-08"
  }

  # ALB HTTP Listener Configuration with Redirect to HTTPS (Revised)
  setting {
    namespace = "aws:elbv2:listener:80" # Explicitly referring to the HTTP listener
    name      = "ListenerEnabled"
    value     = "true"
  }

  setting {
    namespace = "aws:elbv2:listener:80"
    name      = "Protocol"
    value     = "HTTP"
  }

  setting {
    namespace = "aws:elbv2:listener:80"
    name      = "RedirectEnabled" # Enable redirection
    value     = "true"
  }

  setting {
    namespace = "aws:elbv2:listener:80"
    name      = "RedirectPort" # Redirect to port 443 (HTTPS)
    value     = "443"
  }

  setting {
    namespace = "aws:elbv2:listener:80"
    name      = "RedirectStatusCode" # Use a 301 Moved Permanently redirect
    value     = "HTTP_301"
  }

  # Health Check Path Configuration
  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckPath"
    value     = "/api/health"
  }

  # Tags
  tags = {
    Environment = var.env_name
    Application = var.app_name
    ManagedBy   = "Terraform"
  }

  depends_on = [
    aws_elastic_beanstalk_application_version.todo_app_initial,
    aws_db_instance.todo_postgres,
    aws_iam_role_policy_attachment.attach_eb_secrets_policy,
    aws_security_group_rule.alb_to_eb_http,
    aws_security_group_rule.alb_to_eb_https,
    aws_iam_role_policy_attachment.attach_eb_jwt_secrets_policy,
    aws_secretsmanager_secret_version.todo_jwt_secret_version
  ]
}