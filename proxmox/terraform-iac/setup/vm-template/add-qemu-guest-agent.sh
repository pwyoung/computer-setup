#!/bin/bash

# Improve integration with the Proxmox server

apt-get install qemu-guest-agent
systemctl start qemu-guest-agent
systemctl status qemu-guest-agent
systemctl enable qemu-guest-agent


