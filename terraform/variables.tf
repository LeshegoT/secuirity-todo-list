# variables.tf

variable "aws_region" {
  description = "The AWS region to deploy resources into."
  type        = string
  default     = "af-south-1" # Example default, change as needed
}

variable "domain_name" {
  description = "The domain name for the hosted zone and ACM certificate."
  type        = string
  default     = "todo-secure-list.xyz"
}

variable "app_name" {
  description = "The name of the application."
  type        = string
  default     = "todo-app"
}

variable "env_name" {
  description = "The name of the Elastic Beanstalk environment."
  type        = string
  default     = "production"
}

variable "vpc_cidr_block" {
  description = "The CIDR block for the VPC."
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
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "db_engine_version" {
  description = "The version of the PostgreSQL database engine."
  type        = string
  default     = "17.4"
}

variable "db_instance_class" {
  description = "The instance class for the RDS PostgreSQL instance."
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "The name of the PostgreSQL database."
  type        = string
  default     = "tododb"
}

variable "username" {
  description = "The master username for the PostgreSQL database."
  type        = string
  default     = "masteruser"
}

variable "db_port" {
  description = "The port for the PostgreSQL database."
  type        = number
  default     = 5432
}

variable "ssh_key_name" {
  description = "The port for the PostgreSQL database."
  type        = string
  default     = "secuirity-bastion"
}

variable "emails" {
  type = list(string)
  default = [
    "Repo.Talane@bbd.co.za",
    "Tebogo.Motibana@bbd.co.za",
    "Temwa.Nyirenda@bbd.co.za",
    "Franco.DuBuisson@bbd.co.za"
  ]
}