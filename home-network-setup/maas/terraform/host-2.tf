# https://github.com/maas/terraform-provider-maas
# https://registry.terraform.io/providers/maas/maas/latest/docs#heading--resources

# Physical machine
#   SNAFU: This had to be created manually
#     The reason is that TF-MAAS does not support Commissioning with the newest Ubuntu (22.04) and this
#     machine fails to be Commissioned with the old/default Ubuntu release (20.04).
#     The "maas_machine" resource does not support specifying the Commissioning release and
#     The "maas_machine" resource does not respect the default Commissioning release.
#     So, this has to be Commissioned manually.
#     To avoid using a "data source" (or tinkering with "terraform import") I just deployed using the Web UI too.
#
# resource "maas_machine" "m_2" {}
#    Just manually create a virsh host
# resource "maas_vm_host" "virsh_2" {}

# Create empty Virtual Machines
# Time ~2:30
resource "maas_vm_host_machine" "kvm_2" {
  count = 2
  #count = 0 # Delete the Virtual Machines

  #vm_host = maas_vm_host.virsh_2[0].id
  vm_host = "${var.machine_2_hostname}"

  hostname = "${var.machine_2_hostname}-${count.index+1}"
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
resource "maas_instance" "kvm_2" {
  count = length(maas_vm_host_machine.kvm_2)
  #count = 0

  allocate_params {
    # Find the VM by hostname
    hostname = maas_vm_host_machine.kvm_2[count.index].hostname
  }

  deploy_params {
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