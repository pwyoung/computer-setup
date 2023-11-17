#!/bin/bash

# Tell the user if/when the setuid bit is turned off
# for the helper program we need to run qemu user sessions
# with bridged networking.

if command -v kvm >/dev/null; then

    L=$HOME/.kvm.sh.out

    F=/usr/lib/qemu/qemu-bridge-helper

    if [ ! -u "$F" ]; then
        D=$(date)
        cat <<EOF | tee -a $L
$D
$F does not have setuid set
Run the following to fix this:
  sudo chmod +s $F

NOTE:
  The setuid bit must be turned on for the helper program
  to support qemu user sessions with bridged networking.
EOF
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
