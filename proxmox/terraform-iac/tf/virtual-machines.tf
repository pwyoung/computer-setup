# https://registry.terraform.io/providers/Telmate/proxmox/latest/docs/resources/vm_qemu

resource "proxmox_vm_qemu" "resource-name" {
  name        = "ubuntu-via-telmate"

  # Node to create the VM on
  target_node = "pve"

  clone = "ubuntu-uefi"
  full_clone = true

  # memory = 8192

  # balloon = 1

  # nameserver = 8.8.8.8

}