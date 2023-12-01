#!/bin/bash

SSH_ALIAS="proxmox"

scp ./get-vm-network-info-on-pve.sh $SSH_ALIAS:~/ &>/dev/null

ssh $SSH_ALIAS 'bash -c ~/get-vm-network-info-on-pve.sh'


