#!/bin/bash

set -e

# Best doc
#   https://nopresearcher.github.io/Proxmox-GPU-Passthrough-Ubuntu/
#
# Document how to pass a GPU to a VM
#   https://pve.proxmox.com/wiki/PCI_Passthrough
#   https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
# Run this on the proxmox server (as root)

update_kernel_args() {

    # Use this
    # https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
    # IMPORTANT ADDITIONAL COMMANDS
    # emacs /etc/default/grub
    #   GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"

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

    # From https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
    # IMPORTANT ADDITIONAL COMMANDS
    # GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"
    # For more information on what these commands do and how they help:
    #   A. Disabling the Framebuffer: video=vesafb:off,efifb:off
    #   B. ACS Override for IOMMU groups: pcie_acs_override=downstream,multifunction

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

    # First slot (nearest the CPU)
    0000:01:00.0 16
    0000:01:00.1 16

    # Second slot
    0000:08:00.0 21
    0000:08:00.1 21
EOF
}

blacklist_drivers() {
    if ! grep nouveau /etc/modprobe.d/blacklist.conf; then
        echo "blacklist nouveau" >> /etc/modprobe.d/blacklist.conf
        echo "blacklist nvidia*" >> /etc/modprobe.d/blacklist.conf
        echo "blacklist radeon" >> /etc/modprobe.d/blacklist.conf

        # Sound card
        echo "blacklist snd_hda_intel" >> /etc/modprobe.d/blacklist.conf
        reboot
    fi

    # lspci -v | egrep -i 'nouveau|nvidia|snd_hda_intel'
    lspci -v

}


# This failed
# This comes from:
#   URL: https://pve.proxmox.com/wiki/PCI_Passthrough
#   Section: How to know if a graphics card is UEFI (OVMF) compatible
check_uefi_ovmf_compatability() {

    cd ~/
    if [ ! -e rom-parser ]; then
        git clone https://github.com/awilliam/rom-parser
        cd rom-parser
        make
    fi

    mkdir -p ~/tmp

    # PCI BUS ID
    # pvesh get /nodes/pve/hardware/pci --pci-class-blacklist ""  | grep -i nvidia | awk '{print $6, $8}' | head -1
    ID='0000:08:00.0'

    cd /sys/bus/pci/devices/$ID/
    echo 1 > rom
    cat rom > ~/tmp/image.rom
    echo 0 > rom

    ~/rom-parser/rom-parser ~/tmp/image.rom

}

# This comes from:
#   URL: https://pve.proxmox.com/wiki/PCI_Passthrough
#   Section: The 'romfile' option
romfile_option() {
    echo "Did not do this. The how-to shows how to use type-1 iommu"
    sleep 5
    exit 1

    mkdir -p ~/tmp

    # PCI BUS ID
    # pvesh get /nodes/pve/hardware/pci --pci-class-blacklist ""  | grep -i nvidia | awk '{print $6, $8}' | head -1
    ID='0000:08:00.0'

    # Did not exist (originally)
    # ls -l /usr/share/kvm/vbios.bin

    cd /sys/bus/pci/devices/$ID/
    echo 1 > rom
    cat rom > /usr/share/kvm/vbios.bin
    echo 0 > rom

    # Then you can pass the vbios file (must be located in /usr/share/kvm/) with:
    # ARG="hostpci0: 01:00,x-vga=on,romfile=vbios.bin"
    #ARG="hostpci0: 08:00,x-vga=on,romfile=vbios.bin"
    G=$(echo $ID | perl -pe 's/....:(..:..)../$1/')
    ARG="hostpci0: $G,x-vga=on,romfile=vbios.bin"
    # NOTE: the above would be put in /etc/pve/qemu-server/<VM-ID>.conf

}


################################################################################
# https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
################################################################################

guide_steps() {
    # Step 1: Configuring the Grub
    #update_kernel_args
    #check_iommu_setup

    # Step 2: VFIO Modules
    cat <<EOF > /etc/modules
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
EOF

    # Step 3: IOMMU interrupt remapping
    #
    # These Files didn't exist
    # WOOHOO
    # - steps above ( check_uefi_ovmf_compatability )
    #   show my IOMMU *IS* TYPE 1
    # - Docs below show vfio supports iommo type 1
    #   https://github.com/torvalds/linux/blob/master/drivers/vfio/vfio_iommu_type1.c
    #   https://docs.kernel.org/driver-api/vfio.html#iommufd-and-vfio-iommu-type1
    echo "options vfio_iommu_type1 allow_unsafe_interrupts=1" > /etc/modprobe.d/iommu_unsafe_interrupts.conf
    #
    # This should help on Windows VMs
    #   https://wiki.archlinux.org/title/QEMU
    #   https://www.reddit.com/r/Proxmox/comments/gvylgj/how_unstable_are_unsafe_interrupts/
    echo "options kvm ignore_msrs=1" > /etc/modprobe.d/kvm.conf

    # Step 4: Blacklisting Drivers
    # blacklist_drivers

    # Step 5: Adding GPU to VFIO
    lspci -v
    # PCI BUS ID
    # pvesh get /nodes/pve/hardware/pci --pci-class-blacklist ""  | grep -i nvidia | awk '{print $6, $8}' | head -1
    ID='0000:01:00.0'
    G=$(echo $ID | perl -pe 's/....:(..:..)../$1/') # 01:00
    lspci -n -s $G
    #lspci -n -s 01:00
    #  01:00.0 0300: 10de:2684 (rev a1)
    #  01:00.1 0403: 10de:22ba (rev a1)
    # Vendor IDs
    echo "options vfio-pci ids=10de:2684,10de:22ba disable_vga=1"> /etc/modprobe.d/vfio.conf
    reset
    reboot

    # Check that the "vfio" driver is in use
    lspci -v
    # Both the "VGA Controller" and "Audio Controller" show:
    # Kernel driver in use: vfio-pci


    # Linux Guest VM
    #   https://nopresearcher.github.io/Proxmox-GPU-Passthrough-Ubuntu/
    # Setup SSH to VM
    #   sudo apt update
    #   sudo apt install openssh-server
    #   sudo systemctl enable ssh
    #   sudo systemctl status ssh
    #   #
    #   ssh-copy-id pyoung@192.168.3.114
    #   ssh pyoung@192.168.3.114
    #
    # On Proxmox-VE
    #   ProxmoxGUI->VM->Hardware->Display->None
    #   Tell VM to use PCI group
    #   cat /etc/pve/qemu-server/104.conf  | grep hostpci
    #   hostpci0: 01:00
    #   Adding this caused it to not boot ",x-vga=on"
    #
    #
    # On VM
    # cat /etc/default/grub | grep nomodeset
    # GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"


}

#update_kernel_args
#check_iommu_setup
#check_pci_groups
#blacklist_drivers
## failed ## check_uefi_ovmf_compatability
## Didn't update any config file ## romfile_option


guide_steps
