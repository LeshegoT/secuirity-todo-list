# IAM Roles and Policies
resource "aws_iam_role" "todo_eb_ec2_role" {
  name = "${var.app_name}-elasticbeanstalk-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name = "${var.app_name}-EB-EC2-Role"
  }
}

resource "aws_iam_policy" "eb_secrets_access" {
  name = "${var.app_name}-eb-secrets-access"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = aws_db_instance.todo_postgres.master_user_secret[0].secret_arn
      }
    ]
  })
}

resource "aws_iam_policy" "eb_jwt_secrets_access" {
  name = "${var.app_name}-eb-jwt-secrets-access"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = aws_secretsmanager_secret.todo_jwt_secret.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_eb_jwt_secrets_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = aws_iam_policy.eb_jwt_secrets_access.arn
}

resource "aws_iam_role_policy_attachment" "attach_eb_secrets_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = aws_iam_policy.eb_secrets_access.arn
}

resource "aws_iam_role_policy_attachment" "todo_eb_ec2_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "todo_eb_ec2_s3_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "todo_eb_ec2_secrets_manager_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

resource "aws_iam_instance_profile" "todo_eb_instance_profile" {
  name = "${var.app_name}-elasticbeanstalk-instance-profile"
  role = aws_iam_role.todo_eb_ec2_role.name
}

resource "aws_iam_role" "todo_eb_service_role" {
  name = "${var.app_name}-elasticbeanstalk-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name = "${var.app_name}-EB-Service-Role"
  }
}

resource "aws_iam_role_policy_attachment" "todo_eb_service_policy" {
  role       = aws_iam_role.todo_eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "todo_eb_service_managed_policy" {
  role       = aws_iam_role.todo_eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_multicontainer_docker_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_worker_tier_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_cloudwatch_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchFullAccess"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_ecr_readonly_policy" {
  role       = aws_iam_role.todo_eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
