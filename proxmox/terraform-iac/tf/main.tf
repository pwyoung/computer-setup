# https://registry.terraform.io/providers/bpg/proxmox/latest/docs

# https://registry.terraform.io/providers/bpg/proxmox/latest/docs/resources/virtual_environment_vm
resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  name      = "test-ubuntu"
  #vm_id     = 4321

  node_name = "pve"

  description = "Managed by Terraform"
  tags        = ["terraform", "ubuntu"]

  agent {
    # read 'Qemu guest agent' section, change to true only when ready
    enabled = false
  }

  startup {
    order      = "3"
    up_delay   = "60"
    down_delay = "60"
  }

  disk {
    # The datastore MUST be called "local-lvm"
    # Somewhere it is hard-coded and will use that value
    # I created 'local-lvm' manually since my Proxmox is using ZFS
    datastore_id = "local-lvm"
    file_id      = proxmox_virtual_environment_file.ubuntu_cloud_image.id

    # interface    = "scsi0"
    interface    = "virtio0"
    iothread     = true
    discard      = "on"
    size         = 55

  }

  initialization {
    ip_config {
      ipv4 {
        address = "dhcp"
      }
    }

    user_account {
      keys     = [trimspace(tls_private_key.ubuntu_vm_key.public_key_openssh)]
      password = random_password.ubuntu_vm_password.result
      username = "ubuntu"
    }

    # TODO: add a config
    # user_data_file_id = proxmox_virtual_environment_file.cloud_config.id
  }

  network_device {
    bridge = "vmbr0"
  }

  operating_system {
    type = "l26"
  }

  serial_device {}

}

resource "proxmox_virtual_environment_file" "ubuntu_cloud_image" {
  content_type = "iso"
  #datastore_id = "local" # Can't use zpool
  #datastore_id = "local-lvm" # Can't upload to LVM
  datastore_id = "local-dir" # Created this on ext4
  node_name    = "pve"

  source_file {
    # you may download this image locally on your workstation and then use the local path instead of the remote URL
    #path      = "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
    #
    # created ext4 storage "local-dir" at /mnt/local-dir
    # Fetch and customize image into ext4 storage "local-dir" at pve host "/mnt/local-dir"
    # cd /mnt/local-dir
    # wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img
    # cp ./jammy-server-cloudimg-amd64.img ./jammy-server-cloudimg-amd64.updated.img
    # user/pw = root/testpw
    # virt-customize -a ./jammy-server-cloudimg-amd64.updated.img --root-password password:testpw
    path      = "/imgs/jammy-server-cloudimg-amd64.updated.img"

  }
}


################################################################################
# CREDS
################################################################################

resource "random_password" "ubuntu_vm_password" {
  length           = 16
  override_special = "_%@"
  special          = true
}

resource "tls_private_key" "ubuntu_vm_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

output "ubuntu_vm_password" {
  value     = random_password.ubuntu_vm_password.result
  sensitive = true
}

output "ubuntu_vm_private_key" {
  value     = tls_private_key.ubuntu_vm_key.private_key_pem
  sensitive = true
}

output "ubuntu_vm_public_key" {
  value = tls_private_key.ubuntu_vm_key.public_key_openssh
}
