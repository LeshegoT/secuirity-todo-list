variable "aws_region" {
  description = "The AWS region to deploy resources into."
  type        = string
  default     = "af-south-1"
}

variable "app_name" {
  description = "Name of the application."
  type        = string
  default     = "app-todo"
}

variable "env_name" {
  description = "Name of the Elastic Beanstalk environment."
  type        = string
  default     = "Production-todo"
}

variable "db_instance_class" {
  description = "The instance type of the RDS database."
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "The name of the database to create."
  type        = string
  default     = "todoappdb"
}

variable "db_port" {
  description = "Port for the RDS PostgreSQL database."
  type        = number
  default     = 5432
}

variable "db_engine_version" {
  description = "The version of the PostgreSQL database engine."
  type        = string
  default     = "17.4"
}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "username" {
  description = "Master username for the RDS instance"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "The custom domain name for your application"
  type        = string
}