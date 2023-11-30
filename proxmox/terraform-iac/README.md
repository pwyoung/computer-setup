# Goal
- Automate creation of dev machine.

# References
- Terraform Providers
  - https://registry.terraform.io/browse/providers
- Specific Providers
  - Proxmox
    - BPG: https://registry.terraform.io/providers/bpg/proxmox/latest/docs
    - Telmate: ...
    
# Boiler-Plate
- As always, everything should "just work" by running "make".

# Details
- Provision
  - Current:
    This uses Terraform (with ProxMox) to create a VM
  - TODO
    Add support for other Terraform provisioned targets:
      - Cloud (AWS/Azure)
      - Bare-Metal (MaaS)
      - Existing machine (Libvirt)
- Configure
  - Current:
    Use git repos/scripts to configure
  - TODO:
    Use an Ansible job


