#!/bin/bash

# Get vars
. ./config.sh

# To mount all exports from a server
#   EXPORTDIR='/'

run_cmd() {
    tgt="$1"
    cmd="$2"

    echo "Run: $cmd"
    ssh $tgt "$cmd"
}

mount_nfs_export_dir() {

    for i in $SSH_TGTS; do
        echo "Set up $i"

        # Install NFS if necessary
        run_cmd "$i" "command -v nfsstat || sudo apt-get update && sudo apt-get install -y nfs-common"

        # Show NFS services on server
        run_cmd "$i" "rpcinfo -p $SERVER | grep nfs"

        # Update /etc/fstab
        MARGS='rw,bg,soft,intr,nosuid,user'
        LINE="$SERVER:$EXPORTDIR  $LOCALDIR    nfs4    $MARGS    0 0"
        # Update /etc/fstab if MATCH is not found in /etc/exports
        MATCH="$SERVER:$EXPORTDIR"
        #run_cmd "$i" "cat /etc/fstab | grep '$MATCH' && echo 'MATCHED to $MATCH' || echo 'NO MATCH to $MATCH'"
        run_cmd "$i" "cat /etc/fstab | grep '$MATCH' || sudo cp -f /etc/fstab /etc/fstab.backup && echo '$LINE' | sudo tee -a /etc/fstab"

        # Mount
        run_cmd "$i" "sudo mkdir -p $LOCALDIR"
        run_cmd "$i" "sudo mount $LOCALDIR"

        # Umount
        # run_cmd "$i" "sudo umount $LOCALDIR"
        # run_cmd "$i" "sudo umount -f -l $LOCALDIR" # force unmount (e.g. if server is gone/hosed)
    done

}

test_all() {
    for i in $SSH_TGTS; do
        echo "Test $i"
        run_cmd "$i" "ls $LOCALDIR"
    done
}

mount_nfs_export_dir
test_all
