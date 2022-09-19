#!/bin/bash

set -e

# Nodeweaver requirements
#   https://12.docs.nodeweaver.eu/#/requirements

# Notes
#   NW compares itself to VDI solutions such as:
#     https://www.dell.com/en-us/dt/corporate/newsroom/announcements/2015/02/20150203-01.htm

FAIL='N'

check_virtualization_support() {
    # Check for virtualization support
    # https://www.cyberciti.biz/faq/linux-xen-vmware-kvm-intel-vt-amd-v-support/
    N=$(cat /proc/cpuinfo | egrep --color 'svm|vmx' | wc -l)
    if [ $N -gt 0 ]; then
        echo "Virtualization is supported"
    else
        echo "Virtualization is not supported"
        FAIL='Y'
    fi
}


check_ram() {
    # iso installer needs 16GB RAM
    R=$(free -g | head -2 | tail -1 | awk '{print $2}')
    MIN='16'
    if [ "$R" -ge "$MIN" ]; then
        echo "We have at $R GB of ram ($MIN is required)"
    else
        echo "We have only $R GB of ram ($MIN is required)"
        FAIL='Y'
    fi
}

check_64bit_system() {
    M=$(uname -m)

    L=$(getconf LONG_BIT)
    if [ "$L" == "64" ]; then
        echo "System appears to be 64-bit"
    else
        echo "Platform does not appear to be 64-bit ($L, $M)"
        FAIL='Y'
    fi
}

check_known_platform() {
    if [ "$M" == "x86_64" ]; then
        echo "Platform is recognized ($M)"
    elif [ "$M" == "amd64" ]; then
        echo "Platform is recognized ($M)"
    elif [ "$M" == "x64" ]; then
        echo "Platform is recognized ($M)"
    elif [ "$M" == "aarch64" ]; then
        echo "Platform is recognized (Arm 64-bit, $M)"
    elif [ "$M" == "armv7l" ]; then
        echo "Platform is recognized (Arm 32-bit, $M)"
    else
        echo "Platform is not recognized (got $M)"
        FAIL='Y'
    fi
}

check_failures() {
    if [ "$FAIL" == "Y" ]; then
        echo "Exiting"
        exit 1
    fi
}

check_uefi() {
    if ls /sys/firmware/efi &>/dev/null; then
        echo "Running UEFI"
    else
        echo "Not running UEFI"
        exit 1
    fi
}

check_firmare() {
    if command -v rpi-eeprom-update; then
        #CMD='sudo rpi-eeprom-update -d -a'
        #echo "Update PI firmware via: $CMD"
        CMD='sudo apt full-upgrade'
        echo "Update ALL PI software (and firmware) via: $CMD"
    fi
}

check_virtualization_support
check_ram
check_64bit_system
check_known_platform
check_uefi

check_firmware

check_failures
