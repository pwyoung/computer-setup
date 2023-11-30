# https://registry.terraform.io/providers/Telmate/proxmox/latest/docs

terraform {
  required_providers {
    proxmox = {
      source  = "telmate/proxmox"
      version = "2.6.8"
    }
  }
}

provider "proxmox" {
  pm_api_url = var.virtual_environment_endpoint
  pm_user = var.virtual_environment_username
  pm_password = var.virtual_environment_password
  pm_tls_insecure = true

  #pm_debug = true
  #pm_timeout = 800

}
