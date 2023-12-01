# https://registry.terraform.io/providers/bpg/proxmox/latest/docs

data "local_file" "config" {
  filename = "config.yaml"
}

locals {
  config = yamldecode(data.local_file.config.content)
  virtual_machines = local.config.virtual_machines
  virtual_machine_globals = local.config.virtual_machine_globals
}

# https://registry.terraform.io/providers/bpg/proxmox/latest/docs/resources/virtual_environment_vm
resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  count = length(local.virtual_machines)

  # VM Name (not hostname)
  name  = local.virtual_machines[count.index].name

  # Useful for scripting and ordering in the GUI
  vm_id = local.virtual_machines[count.index].vm_id

  node_name = local.virtual_machine_globals.node_name

  description = local.virtual_machine_globals.description
  tags        = local.virtual_machine_globals.tags

  # The defaults for these settings are not inherited from the clone source
  # These settings are for UEFI (which we need for GPU/PCIe pass-through)
  machine = "q35"
  bios = "ovmf"

  clone {
    vm_id = local.virtual_machine_globals.clone_vm_id
    retries = 2 # optional
  }

  agent {
    enabled = local.virtual_machine_globals.agent_enabled
  }

  network_device {
    mac_address = local.virtual_machines[count.index].mac_address
  }

}
