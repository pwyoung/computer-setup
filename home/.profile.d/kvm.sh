#!/bin/bash

# LOG file
#L=$HOME/.kvm.sh.out
L=/dev/null

if command -v kvm >/dev/null; then
    echo "Checking group and perms on $F" >> $L

    F=/usr/lib/qemu/qemu-bridge-helper
    if ls -l $F | grep '\-rwsrwxr\-x' | grep "root $USER"; then
        echo "No need to fix group and perms on $F" >> $L
    else
       echo "Fix group and perms on $F" >> $L
       sudo chgrp $USER $F
       sudo chmod 4775 $F
    fi

fi

# To cleanup
#   Domains
#     virsh -c qemu:///system list --all
#     virsh -c qemu:///session list --all
#   Pools
#     virsh pool-list
#   Volumes
#     virsh vol-list default
#     virsh vol-delete --pool default test-module-makenode-1.img

#
# Default to "session" connection (user connection)
if command -v virsh >/dev/null; then
    # instead of "-c qemu:///session"
    export LIBVIRT_DEFAULT_URI="qemu:///session"
    #virsh list --all
fi
