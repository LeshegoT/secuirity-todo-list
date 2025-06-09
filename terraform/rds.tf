# rds.tf

# RDS Subnet Group (for private subnets)
resource "aws_db_subnet_group" "todo_db_subnet_group" {
  name        = "${var.app_name}-db-subnet-group"
  subnet_ids = [for s in aws_subnet.todo_private_subnets : s.id]

  tags = {
    Name = "${var.app_name}-DBSubnetGroup"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "todo_postgres" {
  allocated_storage       = 20
  engine                  = "postgres"
  engine_version          = var.db_engine_version
  instance_class          = var.db_instance_class
  db_name                 = var.db_name
  username                = var.username
  manage_master_user_password = true
  port                    = var.db_port
  skip_final_snapshot     = true     
  multi_az                = true    
  publicly_accessible     = false    
  vpc_security_group_ids  = [aws_security_group.todo_rds_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.todo_db_subnet_group.name
  storage_type            = "gp2"
  maintenance_window      = "Mon:00:00-Mon:01:00" 
  backup_retention_period = 7

  tags = {
    Name = "${var.app_name}-PostgreSQLInstance"
  }
}

# Data source to retrieve credentials from the AWS-managed RDS secret
data "aws_secretsmanager_secret_version" "db_secret" {
  secret_id = aws_db_instance.todo_postgres.master_user_secret[0].secret_arn
}

locals {
  db_secret_json = jsondecode(data.aws_secretsmanager_secret_version.db_secret.secret_string)
}