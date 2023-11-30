#!/bin/bash

# https://pve.proxmox.com/wiki/Cloud-Init_Support
# https://github.com/bpg/terraform-provider-proxmox/blob/main/howtos/cloud-init/native/main.tf

if ! pveum user list; then
    echo "This needs to run on a Proxmox VE Host"
    exit 1
fi

# TODO
