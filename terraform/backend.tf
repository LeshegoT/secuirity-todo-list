# State bucket
terraform {
  backend "s3" {
    bucket       = "sec-state-bucket-todo"
    key          = "sec-state-bucket-todo/terraform.tfstate"
    region       = "af-south-1"
    use_lockfile = true
    encrypt      = true
  }
}

