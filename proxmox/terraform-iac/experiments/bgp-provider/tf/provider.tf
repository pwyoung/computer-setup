# https://github.com/bpg/terraform-provider-proxmox/blob/main/examples/provider/provider.tf

terraform {
  required_providers {
    proxmox = {
      source = "bpg/proxmox"
      version = "0.38.1"
    }
  }
}

provider "proxmox" {
  endpoint = var.virtual_environment_endpoint
  username = var.virtual_environment_username
  password = var.virtual_environment_password
  insecure = true
  ssh {
    agent = true
  }

}
