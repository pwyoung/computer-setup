#!/bin/bash

set -e

SSH_ALIAS='proxmox'

# Assumptions
# - chip is intel
# - gpu is nvidia
# - passwordless SSH works to $SSH_ALIAS (as root user)

# References
# - https://nopresearcher.github.io/Proxmox-GPU-Passthrough-Ubuntu/
# - https://pve.proxmox.com/wiki/PCI_Passthrough
# - https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/

# Temp file
T=/tmp/.mytempfile

reboot_it() {
    ssh $SSH_ALIAS reboot
    sleep 10
    for i in $(seq 1 60); do
        echo "$i"
        if ssh $SSH_ALIAS hostname; then
            return
        else
            sleep 1
        fi
    done
    echo "Is the host awake?"
    exit 1
}

update_grub() {

    cat <<EOF > $T
# If you change this file, run 'update-grub' afterwards to update
# /boot/grub/grub.cfg.
# For full documentation of the options in this file, see:
#   info -f grub -n 'Simple configuration'

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
#GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"
GRUB_CMDLINE_LINUX=""

# If your computer has multiple operating systems installed, then you
# probably want to run os-prober. However, if your computer is a host
# for guest OSes installed via LVM or raw disk devices, running
# os-prober can cause damage to those guest OSes as it mounts
# filesystems to look for things.
#GRUB_DISABLE_OS_PROBER=false

# Uncomment to enable BadRAM filtering, modify to suit your needs
# This works with Linux (no patch required) and with any kernel that obtains
# the memory map information from GRUB (GNU Mach, kernel of FreeBSD ...)
#GRUB_BADRAM="0x01234567,0xfefefefe,0x89abcdef,0xefefefef"

# Uncomment to disable graphical terminal
#GRUB_TERMINAL=console

# The resolution used on graphical terminal
# note that you can use only modes which your graphic card supports via VBE
# you can see them in real GRUB with the command `vbeinfo'
#GRUB_GFXMODE=640x480

# Uncomment if you don't want GRUB to pass "root=UUID=xxx" parameter to Linux
#GRUB_DISABLE_LINUX_UUID=true

# Uncomment to disable generation of recovery mode menu entries
#GRUB_DISABLE_RECOVERY="true"

# Uncomment to get a beep at grub start
#GRUB_INIT_TUNE="480 440 1"
EOF

    scp $T $SSH_ALIAS:/etc/default/grub
    ssh $SSH_ALIAS proxmox-boot-tool refresh
}

update_systemd() {
    # NEW ARGS
    cat <<EOF > $T
intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off
EOF
    scp $T $SSH_ALIAS:/tmp/tmp-1
    ssh $SSH_ALIAS 'cat /tmp/tmp-1 >> /etc/kernel/cmdline'
    ssh $SSH_ALIAS proxmox-boot-tool refresh
}

update_kernel_args() {
    if ! ssh $SSH_ALIAS cat /proc/cmdline | grep 'intel_iommu=on'; then
        X=$(ps --no-headers -o comm 1)
        if [ "$X" == "systemd" ]; then
            update_systemd
        elif [ "$X" == "grub" ]; then
            update_grub
        else
            echo "unknown system $X"
            exit 1
        fi
        reboot_it
    else
        echo "IOMMU is on"
    fi

}

check_iommu_setup() {

    if ! ssh $SSH_ALIAS dmesg | grep -e DMAR -e IOMMU | grep 'DMAR: IOMMU enabled'; then
        echo "IOMMU check failed"
        exit 1
    fi

    if ! ssh $SSH_ALIAS dmesg | grep 'remapping' | grep 'DMAR-IR: Enabled IRQ remapping in'; then
        echo "Remapping check failed"
        exit 1
    fi

}


blacklist_drivers() {
    if ! ssh $SSH_ALIAS 'grep nouveau /etc/modprobe.d/blacklist.conf'; then
        cat <<EOF > $T
blacklist nouveau
blacklist nvidia*
blacklist radeon
blacklist snd_hda_intel
EOF
        scp $T $SSH_ALIAS:/etc/modprobe.d/blacklist.conf
        reboot_it
    fi

}


update_vfio_modules() {
    if ! ssh $SSH_ALIAS 'grep vfio /etc/modules'; then
        cat <<EOF > $T
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
EOF
        scp $T $SSH_ALIAS:/etc/modules
        reboot_it
    fi
}

iommu_interrupt_remapping() {
    #
    # These Files didn't exist
    # WOOHOO
    # - steps above ( check_uefi_ovmf_compatability )
    #   show my IOMMU *IS* TYPE 1
    # - Docs below show vfio supports iommo type 1
    #   https://github.com/torvalds/linux/blob/master/drivers/vfio/vfio_iommu_type1.c
    #   https://docs.kernel.org/driver-api/vfio.html#iommufd-and-vfio-iommu-type1
    if ! ssh $SSH_ALIAS 'grep vfio_iommu_type1 /etc/modprobe.d/iommu_unsafe_interrupts.conf'; then
        cat <<EOF > $T
options vfio_iommu_type1 allow_unsafe_interrupts=1
EOF
        scp $T $SSH_ALIAS:/etc/modprobe.d/iommu_unsafe_interrupts.conf
    fi


    # This should help on Windows VMs
    #   https://wiki.archlinux.org/title/QEMU
    #   https://www.reddit.com/r/Proxmox/comments/gvylgj/how_unstable_are_unsafe_interrupts/
    if ! ssh $SSH_ALIAS 'grep ignore_msrs=1 /etc/modprobe.d/kvm.conf'; then
        cat <<EOF > $T
options kvm ignore_msrs=1
EOF
        scp $T $SSH_ALIAS:/etc/modprobe.d/kvm.conf
    fi

}

add_gpu_to_vfio() {
    if ! ssh $SSH_ALIAS 'pvesh get /nodes/pve/hardware/pci --pci-class-blacklist "" | grep -i nvidia'; then
        echo "Nvidia card was not found by proxmox"
        exit 1
    fi

    if ssh $SSH_ALIAS 'ls -1 /etc/modprobe.d/vfio.conf'; then
        echo "/etc/modprobe.d/vfio.conf exists already"
        return
    fi

    # '0000:01:00.0'
    BUSID=$(ssh $SSH_ALIAS 'pvesh get /nodes/pve/hardware/pci --pci-class-blacklist "" | grep -i nvidia' | grep RTX | cut -d' ' -f 6)

    # 01:00
    G=$(echo $BUSID | perl -pe 's/....:(..:..)../$1/')

    X=$(lspci -n -s $G | cut -d' ' -f 3 | tr "\n" ',')
    # 10de:249c,10de:228b,
    IDS=${X::-1}

    cat <<EOF >$T
options vfio-pci ids=$IDS disable_vga=1
EOF
    scp $T $SSH_ALIAS:/etc/modprobe.d/vfio.conf
    #ssh $SSH_ALIAS 'reset'
    reboot_it

}

################################################################################
# https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
################################################################################

guide_steps() {
    # Step 1: Configuring the Grub
    update_kernel_args
    check_iommu_setup

    # Step 2: VFIO Modules
    update_vfio_modules

    # Step 3: IOMMU interrupt remapping
    iommu_interrupt_remapping

    # Step 4: Blacklisting Drivers
    blacklist_drivers

    # Step 5: Adding GPU to VFIO
    add_gpu_to_vfio

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
    #   #
    #   sudo shutdown -h now
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
    #
    # Check that the "vfio" driver is in use
    # Both the "VGA Controller" and "Audio Controller" show:
    # Kernel driver in use: vfio-pci
    #
    #   cat /etc/default/grub | grep nomodeset
    #   GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"
    #   sudo emacs /etc/default/grub
    #   sudo update-grub
    #
    #   sudo bash -c "echo blacklist nouveau > /etc/modprobe.d/blacklist-nvidia-nouveau.conf"
    #   sudo bash -c "echo options nouveau modeset=0 >> /etc/modprobe.d/blacklist-nvidia-nouveau.conf"
    #   sudo update-initramfs -u
    #
    #   sudo apt-get install nvidia-driver-545
    #
    # sudo apt-get install -y htop wget curl make gcc emacs-nox
    #
    # sudo /sbin/modprobe nvidia
    # lsmod
    # sudo emacs /etc/rc.local
    # reboot
    #

    # lsblk -ao NAME,FSTYPE,FSSIZE,FSUSED,FSUSE%,SIZE,MOUNTPOINT
}


guide_steps
echo "Done"
