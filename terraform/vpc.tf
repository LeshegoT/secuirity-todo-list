# VPC Configuration
resource "aws_vpc" "todo_vpc" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-VPC"
  }
}

# Public Subnets
resource "aws_subnet" "todo_public_subnets" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.todo_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-PublicSubnet-${count.index + 1}"
  }
}

# Private Subnets 
resource "aws_subnet" "todo_private_subnets" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.todo_vpc.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.app_name}-PrivateSubnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "todo_igw" {
  vpc_id = aws_vpc.todo_vpc.id

  tags = {
    Name = "${var.app_name}-IGW"
  }
}

# Route Tables
resource "aws_route_table" "todo_public_rt" {
  vpc_id = aws_vpc.todo_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.todo_igw.id
  }

  tags = {
    Name = "${var.app_name}-PublicRouteTable"
  }
}

resource "aws_route_table" "todo_private_rt" {
  vpc_id = aws_vpc.todo_vpc.id

  tags = {
    Name = "${var.app_name}-PrivateRouteTable"
  }
}

# Route Table Associations
resource "aws_route_table_association" "todo_public_rta" {
  count          = length(aws_subnet.todo_public_subnets)
  subnet_id      = aws_subnet.todo_public_subnets[count.index].id
  route_table_id = aws_route_table.todo_public_rt.id
}

resource "aws_route_table_association" "todo_private_rta" {
  count          = length(aws_subnet.todo_private_subnets)
  subnet_id      = aws_subnet.todo_private_subnets[count.index].id
  route_table_id = aws_route_table.todo_private_rt.id
}

# VPC Endpoint for Secrets Manager
resource "aws_vpc_endpoint" "secretsmanager_endpoint" {
  vpc_id              = aws_vpc.todo_vpc.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true 
  security_group_ids  = [aws_security_group.vpc_endpoint_sg.id] 
  subnet_ids          = [for s in aws_subnet.todo_private_subnets : s.id]

  tags = {
    Name = "${var.app_name}-SecretsManager-VPCEndpoint"
  }
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3_endpoint" {
  vpc_id            = aws_vpc.todo_vpc.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.todo_private_rt.id]

  tags = {
    Name = "${var.app_name}-S3-VPCEndpoint"
  }
}

# VPC Endpoint for CloudWatch Logs 
resource "aws_vpc_endpoint" "cloudwatch_logs_endpoint" {
  vpc_id              = aws_vpc.todo_vpc.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  security_group_ids  = [aws_security_group.vpc_endpoint_sg.id] # Use the new dedicated SG
  subnet_ids          = [for s in aws_subnet.todo_private_subnets : s.id]

  tags = {
    Name = "${var.app_name}-CloudWatchLogs-VPCEndpoint"
  }
}