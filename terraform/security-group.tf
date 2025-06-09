# Security group for the Application Load Balancer (ALB)
resource "aws_security_group" "todo_alb_sg" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.todo_vpc.id

  # Allow HTTPS (443) from the internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }

  # Allow all outbound traffic from ALB
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

# Security group for Elastic Beanstalk instances
resource "aws_security_group" "todo_eb_sg" {
  name        = "${var.app_name}-eb-sg"
  description = "EB instances SG"
  vpc_id      = aws_vpc.todo_vpc.id

  # Allow traffic from the ALB's security group to the application port (8080)
  ingress {
    from_port        = 8080
    to_port          = 8080
    protocol         = "tcp"
    security_groups  = [aws_security_group.todo_alb_sg.id]
    description      = "Allow app port (8080) from ALB only"
  }

  # Allow all outbound traffic for EB service communication
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic for EB service communication (e.g., S3, CloudWatch)"
  }

  # Allow outbound traffic only to specific resources/VPC Endpoints
  egress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = [for s in aws_subnet.todo_private_subnets : s.cidr_block]
    description = "Allow PostgreSQL traffic to RDS (via private subnets)"
  }

  # Egress to VPC Endpoints 
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [for s in aws_subnet.todo_private_subnets : s.cidr_block]
    description = "Allow HTTPS to VPC Endpoints (via private subnets)"
  }

  tags = {
    Name = "${var.app_name}-EBSecurityGroup"
  }
}

# Security group for RDS PostgreSQL instance
resource "aws_security_group" "todo_rds_sg" {
  name        = "${var.app_name}-rds-sg"
  description = "RDS PostgreSQL SG"
  vpc_id      = aws_vpc.todo_vpc.id

  # Allow PostgreSQL traffic from Elastic Beanstalk instances
  ingress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = [for s in aws_subnet.todo_private_subnets : s.cidr_block]
    description = "Allow DB traffic from EB (via private subnets)"
  }

  # Allow PostgreSQL traffic from the Bastion Host's security group
  ingress {
    from_port        = var.db_port
    to_port          = var.db_port
    protocol         = "tcp"
    security_groups  = [aws_security_group.bastion_sg.id] 
    description      = "Allow DB traffic from Bastion"
  }

  tags = {
    Name = "${var.app_name}-RDSSecurityGroup"
  }
}

# Dedicated Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoint_sg" {
  name        = "${var.app_name}-vpc-endpoint-sg"
  description = "VPC Endpoint SG"
  vpc_id      = aws_vpc.todo_vpc.id

  # Ingress rule for the VPC Endpoint SG:
  # Allow traffic from Elastic Beanstalk instances (using their private subnet CIDRs)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    # Use private subnet CIDRs where EB instances reside
    cidr_blocks = [for s in aws_subnet.todo_private_subnets : s.cidr_block]
    description = "Allow HTTPS from EB (via private subnets)"
  }

  # Egress: Allow all outbound from endpoint SG. Can be tightened if needed.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound from VPC Endpoint SG"
  }

  tags = {
    Name = "${var.app_name}-VPCEndpointSecurityGroup"
  }
}

# NEW: Security group for the Bastion Host
resource "aws_security_group" "bastion_sg" {
  name        = "${var.app_name}-bastion-sg"
  description = "Security group for Bastion Host"
  vpc_id      = aws_vpc.todo_vpc.id

  # Ingress: Allow SSH from your specific IP address
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH from your IP"
  }

  # Egress: Allow outbound to RDS (private subnets) and general internet
  egress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = [for s in aws_subnet.todo_private_subnets : s.cidr_block]
    description = "Allow PostgreSQL access to RDS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic from Bastion (for updates, tools)"
  }

  tags = {
    Name = "${var.app_name}-BastionSG"
  }
}

