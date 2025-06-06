# S3 Bucket for Elastic Beanstalk
resource "aws_s3_bucket" "todo_eb_source_bundle" {
  bucket = "${lower(var.app_name)}-eb-source-bundles-${random_string.bucket_suffix.id}"

  tags = {
    Name = "${var.app_name}-EBSourceBundles"
  }
}

resource "aws_s3_bucket_public_access_block" "todo_eb_source_bundle_pab" {
  bucket = aws_s3_bucket.todo_eb_source_bundle.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "todo_eb_source_bundle_versioning" {
  bucket = aws_s3_bucket.todo_eb_source_bundle.id
  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_object" "empty_app" {
  bucket = aws_s3_bucket.todo_eb_source_bundle.id
  key    = "empty-app.zip"
  content_base64 = "UEsDBAoAAAAAAKuAgVcAAAAAAAAAAAAAAAAJAAAALnRvdW52b3JjUEsBAhQDCgAAAAAAgQCrVwAAAAAAAAAAAAAAAAkAAAAAAAAAAAAQAAAAAAAAAC50b3VudnJjUEsFBgAAAAABAAEANwAAAB8AAAAAAA=="
  content_type   = "application/zip"

  tags = {
    Name = "${var.app_name}-EmptyApp"
  }
}
