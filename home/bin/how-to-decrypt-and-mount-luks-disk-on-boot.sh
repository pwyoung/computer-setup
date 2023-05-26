#!/bin/bash

# GOAL: Record steps to automatically use 2nd disk as /data
# Resources:
#   - https://www.cyberciti.biz/hardware/cryptsetup-add-enable-luks-disk-encryption-keyfile-linux/
#   - https://access.redhat.com/solutions/230993
#   - https://unix.stackexchange.com/questions/702151/automatically-mounting-luks-encrypted-volume-during-boot

#set -x

DISK='/dev/nvme0n1p1'

function steps() {
    echo "Steps followed..."
    echo "Step #1: Manually set up Full Disk Encryption (FDE) using the 'disks' app in PopOs"
    echo "Step #2: Set up using crypttab key file"
}

function set_disk() {
    if (( ${#DISK} == 0 )); then
        echo "ERROR: Varible 'DISK' must be set!"
        echo ""
        echo "Showing disks with UUIDs"
        lsblk -o+UUID
        exit 1
    fi
    echo "DISK is $DISK"
}

function set_uuid() {
    str=`echo $DISK | cut -d'/' -f 3`
    echo "str is $str"
    UUID=`lsblk -o+UUID | grep $str | awk '{ print $7 }'`
    uuid_len=${#UUID}
    if (( $uuid_len != 36 )); then
        echo "UUID length is ${#UUID}, value is $UUID"
        exit 1
    else
        echo "UUID is $UUID"
    fi
}

function setup_luks_via_crypttab_file() {
    if ! sudo ls -l /root > /dev/null; then
        echo "Run with sudo permissions"
        exit 1
    fi

    F=/root/crypttab.key
    if [ -e $F ]; then
        echo "$F exists, not recreating it"
    else
        sudo dd if=/dev/urandom  of=$F  bs=1024   count=4
        chmod 400 $F
    fi

    # List LUKS disks
    # blkid -t TYPE=crypto_LUKS -o device

    # Get the UUID of the disk, if it already has a Luks header
    UUID2=`sudo cryptsetup luksUUID $DISK`
    if [ "$UUID" == "$UUID2" ]; then
        echo "Disk appears to be set up. It has a Luks header"
    else
        echo "TODO: manually set up the disk (format etc)"
        exit 1
    fi

    # Add a "slot" in the Luks header.
    # Each slot is a mechanism to access the actual key used to encrypt the data.
    #
    # Assume the disk should have 2 slots, one initially created, and one
    # we will add below. But, don't add a 3rd slot
    NSLOTS=`sudo cryptsetup luksDump $DISK | grep 'Cipher key' | wc -l`
    if (( $NSLOTS == 2 )); then
        echo "The number of slots is $NSLOTS. It looks like we already added a crypt file"
    else
        if (( $NSLOTS != 1 )); then
            echo "The number of slots is $NSLOTS. It should be just 1, the original passphrase used when the disk was set up"
            exit 1
        else
            echo "Enter the passphrase used when disk was originally set up with Luks"
            sudo cryptsetup luksAddKey $DISK  /root/crypttab.key
        fi
    fi

    echo "Showing luks data"
    # https://linux.die.net/man/8/cryptsetup
    sudo cryptsetup luksDump $DISK

    # UPDATE /etc/crypttab
    # ls -l /etc/crypttab # Shows 0644 perms. Docs say it should be 0600
    #
    # Existing file, for posterity (in case I hose it)
    #cat /etc/crypttab
    #cryptdata UUID=7fec20b3-845e-430f-9ae7-80a5deaa626d none luks
    #cryptswap UUID=9df38cae-4d0a-40a9-ad67-b27537259df6 /dev/urandom swap,plain,offset=1024,cipher=aes-xts-plain64,size=512
    #
    # File format: <volume-name>   <encrypted-device>   <key-file>   <options>
    # ADDED LINE:
    # data UUID=c8525f26-9617-4864-ab7c-516861707a8c /root/crypttab.key luks

    # UPDATE /etc/fstab
    # /dev/mapper/data /data ext4 defaults 1 2

    # Create moun point?
    #sudo mkdir -p /data

    # Manually access the disk
    # sudo cryptsetup -v luksOpen UUID=$UUID $F
    # sudo cryptsetup -v luksOpen UUID=c8525f26-9617-4864-ab7c-516861707a8c /root/crypttab.key


}

steps
set_disk
set_uuid
setup_luks_via_crypttab_file
