#!/bin/bash

# Generate a list of IPs for the running system

# 9901, 9902, etc
VM_IDS=$(qm list | awk '{print $1}' | egrep '^99')

# Only get these interfaces
NETMASK='192'
MACMASK=':99:'

for i in $VM_IDS; do
    ip=$(qm guest cmd $i network-get-interfaces | grep '"ip-address"' | grep "$NETMASK" | cut -d'"' -f 4)
    mac=$(qm guest cmd $i network-get-interfaces | grep '"hardware-address"' | grep "$MACMASK" | cut -d'"' -f 4)
    echo "IP=\"$ip\" MAC=\"$mac\" ID=\"$i\""
done
