#!/bin/bash


BUS=$(nvidia-smi --query-gpu=pci.bus_id --format=csv | tail -1)
echo "BUS=$BUS"

#sudo dmesg | grep -i -e DMAR -e IOMMU

D=/sys/kernel/iommu_groups/
echo "Listing $D"
ls -ltrd $D/*


