# https://registry.terraform.io/providers/bpg/proxmox/latest/docs

# Notes:
# - Commented blocks are meant to be inherited from the clone source
# - The Initialization section is run once on creation (not cloning).
# - So, the Mac Address is assigned (so that the DHCP server can be told to keep the IP constant)
# - For convenience in the GUI, the VM_ID is ordered.
# - To avoid Mac Address conflicts, the last 4 chars of the MAC are the VM_ID
# - After cloning, we might have to update the DHCP lease or we might get an existing IP.
#   sudo dhclient -v -r
#   sudo hostnamectl hostname <new hostname>
#   sudo dhclient -v
#   Or, tweak the template to do it...

data "local_file" "config" {
  filename = "config.yaml"
}

locals {
  config = yamldecode(data.local_file.config.content)
  virtual_machines = local.config.virtual_machines
}

# https://registry.terraform.io/providers/bpg/proxmox/latest/docs/resources/virtual_environment_vm
resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  count = length(local.virtual_machines)

  # VM Name (not hostname)
  name  = local.virtual_machines[count.index].name

  # Useful for advanced scripting and ordering in the GUI
  vm_id = local.virtual_machines[count.index].vm_id

  node_name = "pve"

  description = "Managed by Terraform"
  tags        = ["terraform", "ubuntu"]

  # The defaults for these settings are not inherited from the clone source
  # These settings are for UEFI (which we need for GPU/PCIe pass-through)
  machine = "q35"
  bios = "ovmf"

  clone {
    vm_id = 100 # "ubuntu-2204-template"
    retries = 2 # optional
  }

  network_device {
    mac_address = local.virtual_machines[count.index].mac_address
  }

}
