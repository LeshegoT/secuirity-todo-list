output "elastic_beanstalk_environment_url" {
  description = "The URL of the Elastic Beanstalk environment."
  value       = aws_elastic_beanstalk_environment.todo_app_env.cname
}

output "elastic_beanstalk_environment_endpoint_url" {
  description = "The full URL endpoint of the Elastic Beanstalk environment."
  value       = "http://${aws_elastic_beanstalk_environment.todo_app_env.cname}"
}

output "rds_endpoint" {
  description = "The endpoint address of the RDS PostgreSQL instance."
  value       = aws_db_instance.todo_postgres.address
}

output "rds_port" {
  description = "The port of the RDS PostgreSQL instance."
  value       = aws_db_instance.todo_postgres.port
}

output "rds_database_name" {
  description = "The name of the PostgreSQL database."
  value       = aws_db_instance.todo_postgres.db_name
}

output "secrets_manager_db_credentials_arn" {
  description = "ARN of the AWS-managed Secrets Manager secret storing DB credentials."
  value       = aws_db_instance.todo_postgres.master_user_secret[0].secret_arn
}

output "vpc_id" {
  description = "ID of the VPC created for the Todo app."
  value       = aws_vpc.todo_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = aws_subnet.todo_public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets."
  value       = aws_subnet.todo_private_subnets[*].id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Elastic Beanstalk source bundles."
  value       = aws_s3_bucket.todo_source_bundle.id
}

output "secrets_manager_jwt_secret_arn" {
  description = "ARN of the Secrets Manager secret storing JWT secret."
  value       = aws_secretsmanager_secret.todo_jwt_secret.arn
}

output "bastion_ssh_command" {
  value = "ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_instance.bastion.public_ip}"
}