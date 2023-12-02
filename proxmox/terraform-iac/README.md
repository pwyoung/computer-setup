# Goal
Create VMs suitable for hosting a K8S cluster that can
support GPU-based (AI) workloads.

# Specific requirements
The result should be compatible with Kubespray
and the Nvidia K8S GPU operator.

# Details
- Automate creation of VMs using Proxmox
- Support PCIe passthough of the GPU
- Export IPs for ease of use by subsequent configuration (e.g. via Ansible)

# Prequisites

## Proxmox Virtualation Environment Server (PVE)
- The PVE is running on a host with a supported Nvidia GPU (e.g. 4090)
- The PVE is set up for passthrough.
  See ./setup for a script that automates that.
- The PVE has an exisintg template VM (ubuntu-2204) that can be cloned

## On the machine where Terraform is run
- The following tools are installed
  - make
  - terraform
  - jq

## Config

Create variables.auto.tfvars with credentials for the Proxmox server
```
cd tf
cp variables.auto.tfvars.EXAMPLE variables.auto.tfvars
edit variables.auto.tfvars
```

Create config.yaml with the VMs configured for your system.
```
cd tf
cp config.yaml.EXAMPLE config.yaml
edit config.yaml
```
Notes:
- make sure the GPU PCIe BUS ID is correct.
- Add/remove machines and disks as needed
- If the Proxmox server node name is not the default ("pve") change it here
- Update the Clone source VM_ID as needed


# Running this code

## Creating VMs
- Use "make" or directly call ./run to execute the Terraform code.
- Running ```make``` alone should work, if the Prerequisites are in place.

## Cleanup
- Run ```make clean``` to run "terraform destroy"
- Run ```make clean-all``` to also remove all local files terraform creates

