# Goal
- Automate creation of VMs.

# Boiler-Plate
- As always, everything should "just work" by running "make".

# Details
- Provision
  - Current:
    This uses Terraform (with ProxMox) to create local VMs
- Configure
  - Current:
    Use git repos/scripts to configure

# TODO
- Add support for other Terraform provisioned targets:
  - Cloud (AWS/Azure)
  - Bare-Metal (MaaS)
  - Existing machine (Libvirt)
- Use an Ansible job to configure the machines
  - Make this a separate job, but allow the
    inventory file to be created from this code.

