resource "aws_security_group" "todo_alb_sg" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.todo_vpc.id

  # Ingress: ONLY allow HTTPS (443) from the internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
    description = "Allow HTTPS from internet"
  }

  # Egress: Allow all outbound traffic from ALB (common for health checks, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic from ALB"
  }

  tags = {
    Name = "${var.app_name}-ALBSecurityGroup"
  }
}

resource "aws_security_group" "todo_eb_sg" {
  name        = "${var.app_name}-eb-sg"
  description = "Allow inbound traffic to Elastic Beanstalk instances from ALB only"
  vpc_id      = aws_vpc.todo_vpc.id

  # Ingress: Allow traffic from the ALB's security group to the Docker app port (8080)
  ingress {
    from_port        = 8080 
    to_port          = 8080 
    protocol         = "tcp"
    security_groups  = [aws_security_group.todo_alb_sg.id] 
    description      = "Allow app port (8080) from ALB only"
  }

  # Egress: Allow all outbound traffic from EB instances (for Docker builds, DB, Secrets Manager)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.app_name}-EBSecurityGroup"
  }
}

resource "aws_security_group" "todo_rds_sg" {
  name        = "${var.app_name}-rds-sg"
  description = "Allow inbound traffic to RDS from Elastic Beanstalk instances"
  vpc_id      = aws_vpc.todo_vpc.id

  ingress {
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.todo_eb_sg.id] 
    description     = "Allow PostgreSQL traffic from Elastic Beanstalk"
  }

  tags = {
    Name = "${var.app_name}-RDSSecurityGroup"
  }
}

