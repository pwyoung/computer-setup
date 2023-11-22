#!/bin/bash

set -e

# Automate
# https://pve.proxmox.com/wiki/PCI_Passthrough

# Run this on the proxmox server (as root)

update_kernel_args() {

    cat /proc/cmdline  | grep 'intel_iommu=on' | grep 'iommu=pt'
    # Remember
    cat <<EOF >/dev/null
    BOOT_IMAGE=/boot/vmlinuz-6.2.16-3-pve root=/dev/mapper/pve-root ro quiet intel_iommu=on iommu=pt
EOF

    cat /etc/default/grub | grep GRUB_CMDLINE_LINUX_DEFAULT | grep 'intel_iommu=on' | grep 'iommu=pt'
    # Remember
    cat <<EOF >/dev/null
    GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"
EOF

}

check_iommu_setup() {

    sudo dmesg | grep -e DMAR -e IOMMU | grep 'DMAR: IOMMU enabled'

    # Remember
    cat <<EOF >/dev/null
[    0.004587] ACPI: DMAR 0x000000007803E000 000050 (v01 INTEL  EDK2     00000002      01000013)
[    0.004616] ACPI: Reserving DMAR table memory at [mem 0x7803e000-0x7803e04f]
[    0.131068] DMAR: IOMMU enabled
...
EOF

    sudo dmesg | grep 'remapping' | grep 'DMAR-IR: Enabled IRQ remapping in'

    # Remember
    cat <<EOF >/dev/null
[    0.296629] DMAR-IR: Queued invalidation will be enabled to support x2apic and Intr-remapping.
[    0.297395] DMAR-IR: Enabled IRQ remapping in x2apic mode
EOF

}

check_pci_groups() {
    NODE='pve'
    pvesh get /nodes/$NODE/hardware/pci --pci-class-blacklist "" | grep -i nvidia

    # Remember
    cat <<EOF >/dev/null
    # The GPU is in group 16.
    # There is only one other thing in that group.
    pvesh get /nodes/pve/hardware/pci --pci-class-blacklist ""  | grep -i nvidia | awk '{print $6, $8}'
    0000:01:00.0 16
    0000:01:00.1 16
EOF
}

blacklist_drivers() {
    if ! grep nouveau /etc/modprobe.d/blacklist.conf; then
        echo "blacklist nouveau" >> /etc/modprobe.d/blacklist.conf
        echo "blacklist nvidia*" >> /etc/modprobe.d/blacklist.conf
        reboot
    fi
}

check_uefi_ovmf_compatability() {

    cd ~/
    if [ ! -e rom-parser ]; then
        git clone https://github.com/awilliam/rom-parser
        cd rom-parser
        make
    fi

    mkdir -p ~/tmp

    cd /sys/bus/pci/devices/0000:01:00.0/
    echo 1 > rom
    cat rom > ~/tmp/image.rom
    echo 0 > rom

    cd ~/rom-parser
    ./rom-parser ~/tmp/image.rom

}

#update_kernel_args
#check_iommu_setup
#check_pci_groups
#blacklist_drivers
check_uefi_ovmf_compatability
