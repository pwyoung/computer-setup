# Goal
Allow configuring NFS server and clients
from this machine.

# Requirements

This machine has passwordless-SSH to the machines
as an Admin user (root or passwordless-SUDO)

# To run
- edit ./config.sh
- run the script for the server
- run the script for the clients


# Example config
# - Insecure data disk that Windows can access (e.g. for sharing media files)
#
# /etc/exports
/mnt/data_disk 192.168.3.0/255.255.255.0(rw,nohide,insecure,no_subtree_check,async,all_squash,anonuid=1000,anongid=100\
0)

# /etc/fstab
#
# Export this
/dev/sdb /mnt/data_disk ext4 defaults 0 1
# Test import
192.168.3.234:/mnt/data_disk /mnt/import/data_disk    nfs4    rw,bg,soft,intr,nosuid,user    0 0
