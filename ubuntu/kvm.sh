#!/bin/bash

# INSTRUCTIONS
#   https://help.ubuntu.com/community/KVM/Installation

# CPUs supporting virtualization
egrep -c '(vmx|svm)' /proc/cpuinfo

# Install Libvirt
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
sudo adduser `id -un` libvirt

# Test that it works
virsh list --all

# Add optional GUI
sudo apt-get install virt-manager
newgrp libvirt
virt-manager

# Show status
#   https://www.digitalocean.com/community/tutorials/how-to-use-systemctl-to-manage-systemd-services-and-units
sudo systemctl status libvirt-bin.service
sudo systemctl cat libvirt-bin.service

# Control auto-running
#sudo systemctl disable application.service
#sudo systemctl enable application.service

# Manually start
#sudo systemctl start libvirt-bin.service
