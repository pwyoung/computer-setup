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

echo "Convenience"
sudo apt-get update
sudo apt-get install -y wget curl emacs-nox htop tree

echo "Add SSH server"
sudo apt-get install -y openssh-server

echo "Enable qemu guest-agent"
sudo apt-get install qemu-guest-agent
sudo systemctl start qemu-guest-agent
sudo systemctl status qemu-guest-agent

echo "Enable passwordless-sudo for ubuntu user"
echo "ubuntu ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ubuntu

echo "Create local SSH keys and add my public ones"
if [ ! -e ~/.ssh ]; then
    mkdir ~/.ssh
    chmod 0700 ~/.ssh
    #ssh-keygen -t ed25519 # Follow prompts
fi
URL='https://github.com/pwyoung.keys'
echo "Adding SSH public keys from $URL"
curl -L $URL >> ~/.ssh/authorized_keys


