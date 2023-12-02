#!/bin/bash

# GOAL:
# - Configure a Proxmox server to support PCIe (GPU) Pass-through

# Assumptions
# - The target host $SSH_ALIAS is a Proxmox VE server
# - Passwordless SSH works to $SSH_ALIAS (as root)
# - PVE has CPU from Intel
# - PVE supports IOMMU type-1
# - PVE has one Nvidia GPU

# Notes:
# - This can easily be updated to support AMD CPUs.
# - This can easily be updated to support other GPUs.

# References
# - https://nopresearcher.github.io/Proxmox-GPU-Passthrough-Ubuntu/
# - https://pve.proxmox.com/wiki/PCI_Passthrough
# - https://www.reddit.com/r/homelab/comments/b5xpua/the_ultimate_beginners_guide_to_gpu_passthrough/
# - https://pve.proxmox.com/pve-docs/pve-admin-guide.html#qm_virtual_machines_settings

set -e

# Show debug info
#set -x

SSH_ALIAS='proxmox'

# Temp file
T=/tmp/.mytempfile

report() {
    SEP="####################"
    echo "$SEP"
    echo "$SEP: $1"
    echo "$SEP"
}

reboot_it() {
    # read -p "Hit Enter to reboot $SSH_ALIAS"

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
    report "update_grub()"

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


   ssh $SSH_ALIAS 'proxmox-boot-tool refresh'
   #ssh $SSH_ALIAS 'update-grub'

}

update_systemd() {
    report "update_systemd()"

    ARGS1=$(ssh $SSH_ALIAS 'cat /etc/kernel/cmdline')

    if echo $ARGS1 | grep "iommu"; then
        echo "It looks like IOMMU settings are already in /etc/kernel/cmdline"
        echo "Not updating it"
    else
        ARGS2="intel_iommu=on iommu=pt pcie_acs_override=downstream,multifunction nofb nomodeset video=vesafb:off,efifb:off"

        echo "$ARGS1 $ARGS2" | tee $T
        scp $T $SSH_ALIAS:/etc/kernel/cmdline

        ssh $SSH_ALIAS 'proxmox-boot-tool refresh'
        #ssh $SSH_ALIAS 'reinstall-kernels'
    fi
}

update_kernel_args() {
    report "update_kernel_args()"

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
    report "check_iommu_setup()"

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
    report "blacklist_drivers()"

    if ! ssh $SSH_ALIAS 'grep nouveau /etc/modprobe.d/blacklist.conf'; then
        cat <<EOF > $T
blacklist nouveau
blacklist nvidia*
blacklist radeon
blacklist snd_hda_intel
EOF
        scp $T $SSH_ALIAS:/etc/modprobe.d/blacklist.conf
        ssh $SSH_ALIAS 'update-initramfs -u'
        reboot_it
    fi

}


update_vfio_modules() {
    report "update_vfio_modules()"

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
    report "iommu_interrupt_remapping()"

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
    report "add_gpu_to_vfio()"

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
    IDS=${X::-1}
    # 10de:249c,10de:228b

    cat <<EOF >$T
options vfio-pci ids=$IDS disable_vga=1
EOF
    scp $T $SSH_ALIAS:/etc/modprobe.d/vfio.conf

    reboot_it
}

setup_guest_vms() {
    report "setup_guest_vms()"

    # Guest VM setup steps
    cat <<EOF > $T
################################################################################
# START: MANUAL STEPS
################################################################################
# Guest VM Setup

## Allow Connectivity to VM

### In VM
  sudo apt update
  sudo apt install openssh-server
  sudo systemctl enable ssh
  sudo systemctl status ssh

### In another machine (e.g. the one running this script)
  ssh-copy-id pyoung@192.168.3.114
  ssh pyoung@192.168.3.114

## Add Nvidia driver and some Conveniences to VM

### In VM
  sudo apt-get install -y htop wget curl make gcc emacs-nox
  sudo apt-get install nvidia-driver-545
  # Prevent
  sudo shutdown -h now

## Configure VM itself for Pass-through

### On Proxmox-VE
  From the GUI, pass through the PCIe device:
    PVE->hardware->add->PCI device->choose the Nvidia VGA device
      Select: raw, all functions, ROM bar, PCI-Express
      DeSelect: Primary GPU
  Example of the effect of the above
      cat /etc/pve/qemu-server/<VMID>.conf  | grep hostpci
        hostpci0: 0000:01:00,pcie=1

  Edit the VM's config file
    Note - some args below were taken as-is from tutorials.
           Some are documented here:
           https://www.qemu.org/docs/master/system/i386/kvm-pv.html
    emacs /etc/pve/qemu-server/<VMID>.conf
      # Change/Add these parameters to match the following:
      cpu: host,hidden=1,flags=+pcid
      args: -cpu 'host,+kvm_pv_unhalt,+kvm_pv_eoi,hv_vendor_id=NV43FIX,kvm=off'

################################################################################
# STOP: MANUAL STEPS
################################################################################


################################################################################
# START: Example Proxmox VM config file
################################################################################

# This is to remember a working /etc/pve/qemu-server/<VMID>.conf
#
# I added these lines (to support GPU pass-through)
#   cpu: host,hidden=1,flags=+pcid
#   args: -cpu 'host,+kvm_pv_unhalt,+kvm_pv_eoi,hv_vendor_id=NV43FIX,kvm=off'
#
# From the GUI, configured these lines (to support GPU pass-through):
#   hostpci0: 0000:01:00,pcie=1
#
# And for speed/convenience of the GUI, I use this display driver:
#   vga: virtio
#
agent: 1
args: -cpu 'host,+kvm_pv_unhalt,+kvm_pv_eoi,hv_vendor_id=NV43FIX,kvm=off'
balloon: 0
bios: ovmf
boot: order=scsi0;ide2;net0
cores: 8
cpu: host,hidden=1,flags=+pcid
efidisk0: local-zfs:vm-103-disk-0,efitype=4m,size=1M
hostpci0: 0000:01:00,pcie=1
ide2: local:iso/pop-os_22.04_amd64_nvidia_33.iso,media=cdrom,size=3090528K
machine: q35
memory: 32768
meta: creation-qemu=8.0.2,ctime=1701223075
name: popos-dev
net0: virtio=A2:AE:C7:3A:70:C4,bridge=vmbr0,firewall=1
numa: 0
ostype: l26
parent: working
scsi0: local-zfs:vm-103-disk-1,iothread=1,size=500G
scsihw: virtio-scsi-single
smbios1: uuid=0968faa3-35a5-4390-b158-bd70413b6462
sockets: 1
vga: virtio
vmgenid: 0fe89475-2488-4b99-a064-2f5024d51299

################################################################################
# STOP: Example Proxmox VM config file
################################################################################

EOF

    echo "Look at steps to setup a VM at $T"
}

guide_steps() {
    update_kernel_args

    check_iommu_setup

    update_vfio_modules

    iommu_interrupt_remapping

    blacklist_drivers

    add_gpu_to_vfio

    setup_guest_vms
}

guide_steps
echo "Done"
