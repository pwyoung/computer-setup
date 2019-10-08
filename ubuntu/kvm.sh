#!/bin/bash

#STOP VIRTUALBOX
VB_SVC='vboxautostart-service.service vboxballoonctrl-service.service vboxdrv.service vboxweb-service.service'
for i in $VB_SVC; do
    echo "start service $i"
    sudo systemctl start $i
done

# INSTRUCTIONS
#   https://help.ubuntu.com/community/KVM/Installation

# Make sure virtualization is enabled
egrep -c '(vmx|svm)' /proc/cpuinfo
kvm-ok

# https://help.ubuntu.com/community/KVM/Installation
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# https://www.server-world.info/en/note?os=Ubuntu_19.04&p=kvm&f=1
sudo apt -y install qemu-kvm libvirt-daemon-system libvirt-daemon virtinst bridge-utils libosinfo-bin libguestfs-tools virt-top 

# https://www.hiroom2.com/2019/06/18/ubuntu-1904-kvm-en/
sudo gpasswd libvirt -a
reboot

# Add optional GUI and with libvirt
sudo apt-get install virt-manager
virt-manager

# Not needed
#sudo adduser `id -un` libvirt

# Test that it works
# No errors
virsh list --all


# Control auto-running
#sudo systemctl disable application.service
#sudo systemctl enable application.service

