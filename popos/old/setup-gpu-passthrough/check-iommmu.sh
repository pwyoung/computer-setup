# https://wiki.archlinux.org/title/PCI_passthrough_via_OVMF


check_iommu() {
    # https://wiki.gentoo.org/wiki/GPU_passthrough_with_libvirt_qemu_kvm
    sudo dmesg | grep 'IOMMU enabled'
}

show_iommu_groups() {
    for d in /sys/kernel/iommu_groups/*/devices/*; do
        n=${d#*/iommu_groups/*}
        n=${n%%/*}
        printf 'IOMMU Group %s ' "$n"
        lspci -nns "${d##*/}"
    done
}

show_iommu_groups2() {
    for g in $(find /sys/kernel/iommu_groups/* -maxdepth 0 -type d | sort -V); do
        echo "IOMMU Group ${g##*/}:"
        for d in $g/devices/*; do
            echo -e "\t$(lspci -nns ${d##*/})"
        done;
    done;
}

#lspci -nn

check_iommu
#show_iommu_groups
show_iommu_groups2
