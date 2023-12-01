# Notes:
  - Commented blocks are meant to be inherited from the clone source
  - The Initialization section is run once on creation (not cloning).
  - So, the Mac Address is assigned (so that the DHCP server can be told to keep the IP constant)
  - For convenience in the GUI, the VM_ID is ordered.
  - To avoid Mac Address conflicts, the last 4 chars of the MAC are the VM_ID
  - After cloning, we might have to update the DHCP lease or we might get an existing IP.
    sudo dhclient -v -r
    sudo hostnamectl hostname <new hostname>
    sudo dhclient -v
    Or, tweak the template to do it...
  - Another way to get IPs, dynamically, is from the qemu-guest-agent
    qm guest cmd <VM_ID> network-get-interfaces
