#!/bin/bash

# Assume intel

# https://ostechnix.com/how-to-enable-nested-virtualization-in-kvm-in-linux/

if cat /sys/module/kvm_intel/parameters/nested | egrep 'Y|1'; then
    #options kvm ignore_msrs=1
    F=/etc/modprobe.d/kvm.conf
    L='options kvm_intel nested=1'
    if ! grep "$L" $F; then
        echo "Add '$L' to $F"
        exit 1
    fi
else
    echo "This is not an Intel chip, or it doesn't support nested virtualization"
fi

