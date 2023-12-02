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
resource "proxmox_virtual_environment_vm" "vms" {
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

  dynamic "network_device" {
    for_each = local.virtual_machines[count.index].network_device_list
    content {
      mac_address = network_device.value["mac_address"]
    }
  }

  dynamic "clone" {
    for_each = local.virtual_machines[count.index].clone
    content {
      vm_id = clone.value["vm_id"]
      retries = 2
    }
  }

  dynamic "agent" {
    for_each = local.virtual_machines[count.index].agent
    content {
      enabled = agent.value["enabled"]
    }
  }

  dynamic "vga" {
    for_each = local.virtual_machines[count.index].vga
    content {
      enabled = vga.value["enabled"]
      type = vga.value["type"]
    }
  }

  dynamic "operating_system" {
    for_each = local.virtual_machines[count.index].operating_system
    content {
      type = operating_system.value["type"]
    }
  }

  dynamic "hostpci" {
    for_each = local.virtual_machines[count.index].hostpci_list
    content {
      device = hostpci.value["device"]
      id = hostpci.value["id"]
      pcie = hostpci.value["pcie"]
    }
  }

  dynamic "cpu" {
    for_each = local.virtual_machines[count.index].cpu
    content {
      cores = cpu.value["cores"]
      type = cpu.value["type"]
      # hidden=1 # not supported via TF
      flags = cpu.value["flags"]
    }
  }

  kvm_arguments = local.virtual_machines[count.index].kvm_arguments
}

output "ip_list" {
  value = ["${proxmox_virtual_environment_vm.vms.*.ipv4_addresses}"]
}