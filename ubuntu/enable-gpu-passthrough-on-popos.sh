#!/bin/bash


# https://wiki.archlinux.org/title/PCI_passthrough_via_OVMF
# https://wiki.gentoo.org/wiki/GPU_passthrough_with_libvirt_qemu_kvm


support_text_mode_via_refind() {
    cat <<EOF
menuentry "POP-1" {
    icon /EFI/refind/icons/os_hwtest.png
    volume 29ABFB71-D207-4D8F-83C8-4A37E140218B
    loader /EFI/systemd/systemd-bootx64.efi
    initrd /boot/initrd.img
    options "ro root=UUID=29abfb71-d207-4d8f-83c8-4a37e140218b"
    submenuentry "Boot to terminal" {
        add_options "systemd.unit=multi-user.target"
    }
    enabled
}
EOF

    sleep 5
    sudo emacs /boot/efi/EFI/refind/refind.conf
}

update_kernel_boot_options() {
    # Add to all boot loader entries
    sudo kernelstub -a iommu=pt
    sudo kernelstub -a intel_iommu=on

    # Gentoo recommends this, but some say it is bad idea (for stability)
    # kernelstub -a pcie_acs_override=downstream,multifunction

    sudo bootctl list
}

show_status() {
    nvidia-smi

    BUS=$(nvidia-smi --query-gpu=pci.bus_id --format=csv | tail -1)
    echo "NVIDIA PCI BUS=$BUS"

    sudo dmesg | grep -i -e DMAR -e IOMMU

    D=/sys/kernel/iommu_groups/
    echo "Listing $D"
    ls -1d $D/*

    echo "Show cmdline"
    cat /proc/cmdline  | grep iommu | grep intel
}

todo() {
    # Bard
    query='I want you to create scripts that will build an ubuntu 22.04 vm using vagrant. The vagrantfile should specify that the vm uses libvirt. The vagrantfile should enable gpu passthrough of a video card with a pci bus id of "00000000:01:00.0". In addition, create a bash script that can run on an ubuntu 22.04 host to enable gpu passthrough. Comment all files.'
}

#support_text_mode_via_refind
#update_kernel_boot_options
show_status
