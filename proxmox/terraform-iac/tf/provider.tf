terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.38.1"
    }
  }
}

provider "proxmox" {
  endpoint  = var.virtual_environment_endpoint

  # api_token = var.virtual_environment_token
  username = var.virtual_environment_username
  password = var.virtual_environment_password

  insecure  = true

  # This gives root access to the PVE server
  # - This is required for building from cloud images.
  # - This is not required for cloning VMs
  #ssh {
  #  agent = true
  #  username = "root"
  #}
}
