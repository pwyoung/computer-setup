#!/bin/bash

# https://registry.terraform.io/providers/Telmate/proxmox/latest/docs

if ! pveum user list; then
    echo "This needs to run on a Proxmox VE Host"
    exit 1
fi

TFROLE="TerraformProv"
TFUSER="terraform-prov@pve"
TFPW="testpw"
PRIVS="Datastore.AllocateSpace Datastore.Audit Pool.Allocate Sys.Audit Sys.Console Sys.Modify VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.Monitor VM.PowerMgmt SDN.Use"

pveum role add $TFROLE -privs "$PRIVS"

pveum user add $TFUSER --password "$TFPW"

pveum aclmod / -user $TFUSER -role $TFROLE

# Modify (reset all) privs
#   pveum role modify $TFROLE -privs "$PRIVS"
