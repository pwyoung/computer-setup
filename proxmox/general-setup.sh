#!/bin/bash

cat <<EOF > /dev/null
Details:
- Machine=q35 (supports PCIe pass-through)
- BIOS=OVMF(UEFI)
- added TPM (in case it's needed)
Speed:
- CPU=host # Recommended for speed. But doesn't work with live migration of VM
Efficiency:
- Memory: ballooning (1GB to 16GB)
- Disk: 500GB (soft provisioning)
EOF

# Convenience
sudo apt-get update
sudo apt-get install -y wget curl emacs-nox htop tree

# Added and enabled SSH server
sudo apt-get install -y openssh-server

# Create local SSH keys and add my public ones
ssh-keygen -t ed25519 # Follow prompts
U='pwyoung' wget curl -L https://github.com/$U.keys >> ~/.ssh/authorized_keys

# Enable passwordless-sudo for ubuntu user
sudo su -
echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/ubuntu

#  Enable qemu guest-agent
apt-get install qemu-guest-agent
systemctl start qemu-guest-agent
systemctl status qemu-guest-agent
systemctl enable qemu-guest-agent
