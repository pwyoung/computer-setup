# https://github.com/maas/terraform-provider-maas
# https://registry.terraform.io/providers/maas/maas/latest/docs#heading--resources

# This works, but, currently The Terraform-MAAS provider can not
# only Deploy the default OS release (Ubuntu 20.04) to a physical machine,
# even though Ubuntu 22.04 is supported in the MAAS Web/CLI interfaces.
# Supporting OS releases other than Ubuntu does not seem to be on the roadmap.
#
# # Physical machine
# # Time ~2:40
# resource "maas_machine" "m_1" {
#   count = 1 # create this, 0 to remove
#
#   power_type = "manual"
#   power_parameters = {}
#   pxe_mac_address = var.machine_1_mac
#
#   # Optional parameters
#   hostname = "${var.machine_1_hostname}"
#   pool = "KVM-Hosts"
#   #zone = ""
#
#   # min_hwe_kernel seems to always cause a failure.
# }
#
# # Allocate, Deploy, and configure the physical machine as a KVM Host
# # Time ~4:50
# resource "maas_vm_host" "virsh_1" {
#   count = length( maas_machine.m_1 ) > 0 ? 1 : 0
#   #count = 0
#
#   type = "virsh"
#
#   # Specify the physical machine and depend on the "maas_machine" resource
#   machine = maas_machine.m_1[0].id
#   #machine = "${var.machine_1_hostname}"
#
#   # Optional parameters
#   #name = maas_machine.m_1[0].hostname # Name that appears in the Virsh list in the web ui
#   name = "${var.machine_1_hostname}-host"
#
#   # cpu_over_commit_ratio = 1.0
#   # memory_over_commit_ratio = 1.0
#   # default_macvlan_mode = ""
#   pool = "virsh_hosts"
#
#   #zone = ""
#
#   #tags = [
#   #  maas_tag.physical.name,
#   #]
#
#   depends_on = [maas_machine.m_1]
# }


# Create empty Virtual Machines
# Time ~2:30
resource "maas_vm_host_machine" "kvm_1" {
  # count = length( maas_vm_host.virsh_1 ) > 0 ? 3 : 0
  # count = 0 # Delete the Virtual Machines
  count = 3

  # vm_host = maas_vm_host.virsh_1[0].id
  vm_host = "oryx.maas"

  hostname = "${var.machine_1_hostname}-${count.index+1}"
  pool = "kvm_vm"

  # Use "cores" or "pinned_cores"
  cores = 1
  #pinned_cores = 1

  memory = 2048

  storage_disks {
    size_gigabytes = 50
  }

}

# Deploy Ubuntu to the VMs
# Time ~3:40
resource "maas_instance" "kvm" {
  count = length( maas_vm_host.virsh_1 ) > 0 ? length(maas_vm_host_machine.kvm_1) : 0
  #count = 0

  allocate_params {
    # Find the VM by hostname
    hostname = maas_vm_host_machine.kvm_1[count.index].hostname
  }

  deploy_params {
    # NOTE: Only Ubuntu is supported.
    # Docs say the default will be used if this is not given. This is not tested yet. But defaults are not used when commissioning or deploying a physical machine.
    #distro_series = "focal" # 20.04
    distro_series = "jammy" # 22.04
  }

  # This has a few problems:
  #   - the device name must match
  #   - this should use some sort of IPAM.
  #   - this got stuck when deploying 3 machines in parallel
  # Just use Ansible for this. E.g. use the maas CLI to generate a list of IPs to make an inventory file.
  #network_interfaces {
  #  name = "ens4" # Name must match exactly
  #  subnet_cidr = var.pxe_cidr
  #  ip_address = cidrhost( var.pxe_cidr, count.index + 30 )
  #}

}