# https://github.com/maas/terraform-provider-maas

terraform {
  required_providers {
    maas = {
      source = "maas/maas"
      version = "1.2.0"
    }
  }
}

provider "maas" {
  api_version = "2.0"
  api_key = var.maas_api_key
  api_url = var.maas_api_url
}
