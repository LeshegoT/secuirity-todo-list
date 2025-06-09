
data "aws_ami" "ubuntu_bastion_ami" {
  most_recent = true
  owners      = ["099720109477"] 

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]

  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Bastion Host EC2 Instance
resource "aws_instance" "bastion" {
  ami                   = data.aws_ami.ubuntu_bastion_ami.id
  instance_type         = "t3.micro"
  subnet_id             = aws_subnet.todo_public_subnets[0].id
  vpc_security_group_ids = [aws_security_group.bastion_sg.id]
  key_name              = var.ssh_key_name

  associate_public_ip_address = true

  tags = {
    Name = "${var.app_name}-Bastion"
  }

  # User data script for Ubuntu
   user_data = <<-EOF
    #!/bin/bash
    apt update -y
    apt install -y postgresql-client curl tar

    FLYWAY_VERSION="10.15.0"
    FLYWAY_TAR_GZ="flyway-commandline-$$FLYWAY_VERSION-linux-x64.tar.gz"
    FLYWAY_DOWNLOAD_URL="https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/$$FLYWAY_VERSION/$$FLYWAY_TAR_GZ"

    echo "Downloading Flyway CLI from $$FLYWAY_DOWNLOAD_URL"
    curl -L "$$FLYWAY_DOWNLOAD_URL" -o /tmp/$$FLYWAY_TAR_GZ

    if [ $$? -ne 0 ]; then
      echo "Failed to download Flyway CLI."
      exit 1
    fi

    echo "Extracting Flyway CLI..."
    mkdir -p /opt/flyway
    tar -xzf /tmp/$$FLYWAY_TAR_GZ --strip-components=1 -C /opt/flyway

    if [ $$? -ne 0 ]; then
      echo "Failed to extract Flyway CLI."
      exit 1
    fi

    echo "Creating symlink for flyway executable..."
    ln -s /opt/flyway/flyway /usr/local/bin/flyway

    echo "Cleaning up..."
    rm /tmp/$$FLYWAY_TAR_GZ
  EOF
}