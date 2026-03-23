terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.33.0"
    }
  }
  backend "s3" {
    bucket = "nicks-terraform-states"
    key    = "mtg_maker_ts/terraform.tfstate"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = "ap-southeast-2"
}


locals {
  prefix_parameter = "/WebsiteCv/production"
  build_folder     = "${path.root}/../dist"
  s3_bucket        = "nickdavesullivan.com"
  base_path        = "mtg-maker"
  tags = {
    Project     = "MTG Maker TS"
    Environment = "production"
  }
}

data "aws_ssm_parameter" "cloudfront_distribution_id" {
  name = "${local.prefix_parameter}/CloudFront/DistributionId"
}

module "template_files" {
  source   = "hashicorp/dir/template"
  base_dir = local.build_folder
}

resource "aws_s3_object" "static_files" {
  for_each     = module.template_files.files
  bucket       = local.s3_bucket
  key          = "${local.base_path}/${each.key}"
  content_type = each.value.content_type
  source       = each.value.source_path
  content      = each.value.content
  etag         = each.value.digests.md5
}

locals {
  old_path_redirects = {
    "index.html"         = "/mtg-maker/"
    "proxy-maker.html"   = "/mtg-maker/#/proxy-maker"
    "compare-decks.html" = "/mtg-maker/#/compare-decks"
    "deck-showcase.html" = "/mtg-maker/#/deck-showcase"
  }
}

resource "aws_s3_object" "redirect_old_path" {
  for_each     = local.old_path_redirects
  bucket       = local.s3_bucket
  key          = "mtg-maker-ts/${each.key}"
  content_type = "text/html"
  content      = <<-HTML
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${each.value}" />
        <link rel="canonical" href="${each.value}" />
      </head>
      <body>
        <p>Redirecting to <a href="${each.value}">${each.value}</a>...</p>
      </body>
    </html>
  HTML
}

resource "terraform_data" "clear_cloudfront_cache" {
  depends_on       = [aws_s3_object.static_files]
  triggers_replace = [timestamp()]
  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${data.aws_ssm_parameter.cloudfront_distribution_id.value} --paths '/${local.base_path}/*' '/mtg-maker-ts/*'"
  }
}

output "deployment_url" {
  value = "https://nickdavesullivan.com/${local.base_path}/"
}
