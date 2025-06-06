# VPC Configuration
resource "aws_vpc" "todo_vpc" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-VPC"
  }
}

# Public Subnets (for Load Balancer and NAT Gateway)
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

# EIP for NAT Gateway
resource "aws_eip" "todo_nat_eip" {
  domain = "vpc"

  tags = {
    Name = "${var.app_name}-NAT-EIP"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "todo_nat_gateway" {
  allocation_id = aws_eip.todo_nat_eip.id
  subnet_id     = aws_subnet.todo_public_subnets[0].id

  tags = {
    Name = "${var.app_name}-NATGateway"
  }

  depends_on = [aws_internet_gateway.todo_igw]
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

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.todo_nat_gateway.id
  }

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
