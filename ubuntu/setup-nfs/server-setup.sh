#!/bin/bash

# Get vars
. ./config.sh

run_cmd() {
    cmd="$1"
    echo "Run: $cmd"
    ssh $SSH_TGT "$cmd"
}

create_nfs_export_dir() {
    # Setup server
    run_cmd "sudo apt update"
    run_cmd "sudo apt-get install -y nfs-kernel-server"

    # Create dir
    run_cmd "sudo mkdir -p $EXPORTDIR"
    run_cmd "sudo chown nobody:nogroup $EXPORTDIR"
    run_cmd "sudo chmod 777 $EXPORTDIR"
    # Test file
    run_cmd "sudo touch $EXPORTDIR/test-file"

    # Export dir
    L="$EXPORTDIR $CIDR(rw,sync,no_subtree_check)"
    N=$(ssh $SSH_TGT "cat /etc/exports" | grep -E -v '^#' | wc -l)
    if [ "$N" -gt 0 ]; then
        echo "/etc/exports already has mounts on $SSH_TGT."
        echo ""
        echo "Add the following line to it manually"
        echo "$L"
        echo ""
        read -p "Hit enter when done"
    else
        F=~/.tmp-file
        echo "$L" > $F
        ssh $SSH_TGT "echo '$L' | sudo tee /etc/exports"
    fi

    # Export dir
    run_cmd "sudo exportfs -a"
    run_cmd "sudo systemctl restart nfs-kernel-server"

    # Test
    # Show exports
    run_cmd "showmount -e"
    # Show NFS services on server
    run_cmd "rpcinfo -p $SERVER | grep nfs"
}

create_nfs_export_dir
