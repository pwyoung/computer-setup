#!/bin/bash

echo "Allow Proxmox to stop the VM, and collect stats"
apt-get install qemu-guest-agent
systemctl start qemu-guest-agent

# Then enable the service to autostart (permanently) if not auto started, with
# systemctl enable qemu-guest-agent
