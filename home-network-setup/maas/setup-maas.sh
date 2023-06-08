#!/usr/bin/bash

# Goal:
#   Setup Maas, using KVM
#
# Background
#   Prefer KVM since it supports GUIs (see: virt-manager, virt-viewer, gnome-boxes, etc)
#   KVM is not fully supported with multipass.
#      Specifically, multipass only supports the '--network' command on LXD
#      The '--network' command is needed to connect to a bridge in order to provide a static IP
#      The static IP of the brige needs to be given to the Maas server to let maas provision VMs.

show_msg() {
    MSG="$1"

    echo "================================================================================"
    echo "${MSG}"
    echo "================================================================================"

    read  -n 1 -p "Hit any key" invar

    # Sleep X seconds
    sleep 0.1
}



# Install KVM
#
install-maas-via-kvm() {
    show_msg "install-maas-via-kvm"

    # Make sure this host supports virtualization
    if ! which kvm-ok; then
        sudo apt install -y cpu-checker
        if ! sudo kvm-ok; then
            echo "This host does not support virtualization, check BIOS settings and CPU features"
            exit 1
        fi
    fi

    # Install KVM
    #   https://help.ubuntu.com/community/KVM/Installation
    if ! kvm --version && libvirtd --version; then
        sudo apt update -y
        sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
    fi

    # Check ownership of important files
    #
    # sudo ls -la /var/run/libvirt/libvirt-sock
    # srw-rw---- 1 root libvirt 0 Jun  7 17:10 /var/run/libvirt/libvirt-sock
    G=$(stat -c '%G' /var/run/libvirt/libvirt-sock)
    GE="libvirt"
    if [ !  "$G" == "$GE" ]; then
        show_msg "Check ownership of /var/run/libvirt/libvirt-sock, group is $G, expected $GE"
        exit 1
    fi
    #
    # Docs say to match the owner
    # sudo chown root:libvirtd /dev/kvm
    #
    # But the detault looks ok, maybe add the user to the kvm group too
    # ls -l /dev/kvm
    # crw-rw----+ 1 root kvm 10, 232 Jun  8 01:20 /dev/kvm
    G=$(stat -c '%G' /dev/kvm)
    GE="kvm"
    if [ !  "$G" == "$GE" ]; then
        show_msg "Check ownership of /var/run/libvirt/libvirt-sock, group is $G, expected $GE"
        exit 1
    fi

    # Check user's group(s)
    if groups | grep libvirt; then
        echo "User has group: libvirt"
    else
        sudo adduser $USER libvirt
        #sudo adduser $USER kvm
        show_msg "Log out and back in again"
        exit 1
    fi

    # KVM Networking - ASSUMES WE ARE USING NETWORK MANAGER
    #   https://help.ubuntu.com/community/KVM/Networking
    #
    # Show that 'nmcli' is installed, and is part of the network-manager tool
    # If it is not installed, don't install it, something else must be managing the network.
    if ! sudo dpkg -S `which nmcli`; then
        sudo apt list --installed | grep 'network-manager'
        show_msg "This assumes we are using network manager."
        exit 1
    fi
    # Make a bridge 'localbr' using the network manager toolset
    if ! ip -c -br addr show dev localbr; then
        sudo nmcli connection add type bridge con-name localbr ifname localbr ipv4.method manual ipv4.addresses 192.168.3.10/24
        # Show the bridge exists (but is down)
        ip -c -br addr show dev localbr
        # Bring up the bridge
        sudo nmcli connection up localbr
        # Show the bridge is up
        ip -c -br addr show dev localbr
        ping -c 1 192.168.3.10
        show_msg "make sure you can ping that from another host too"
    fi
    # To Delete the bridge
    # sudo nmcli connection down localbr
    # sudo nmcli connection delete localbr


    # Create KVM machines:
    #   From CloudImages:
    #     uvt:
    #       https://ubuntu.com/server/docs/virtualization-uvt
    #   From ISO:
    #     virt-install:
    #       https://ubuntu.com/server/docs/virtualization-virt-tools
    #   Via GUI:
    #     virt-manager:
    #       https://ubuntu.com/server/docs/virtualization-virt-tools
    #       https://ubuntu.com/server/docs/virtualization-libvirt
    #   From existing machines
    #     virt-clone:
    #       https://ubuntu.com/server/docs/virtualization-virt-tools


    # Also useful:
    #   Viewer only
    #     virt-viewer:
    #       https://ubuntu.com/server/docs/virtualization-virt-tools
    #   Optimizing libvirt machines
    #      https://ubuntu.com/server/docs/virtualization-libvirt
    #   Migrating VMs
    #     https://ubuntu.com/server/docs/virtualization-libvirt

    # GUI
    #









    # Show that the instance is in libvirt
    virsh list
    #  Id   Name                  State
    # -------------------------------------
    # 1    reciprocal-bontebok   running








    # https://releases.ubuntu.com/jammy/
    # Supports PXE and all other modes of installation, per
    #   http://archive.ubuntu.com/ubuntu/dists/jammy/main/installer-amd64/20101020ubuntu629/legacy-images/
    wget https://releases.ubuntu.com/jammy/ubuntu-22.04.2-live-server-amd64.iso

    # Start a KVM instance via virsh (libvirt native)
    # virsh start maas-server
    #
    # Use maas to create an instant


    # A Gui for libvirt
    # sudo apt install virt-manager


    if which maas >/dev/null; then
	echo "Command 'maas' is in PATH. Assuming it is installed properly."
    else
	#Installing Maas per https://maas.io/docs/how-to-do-a-fresh-install-of-maas
	#via <3.3 packages> (as opposed to snap)
	sudo apt-add-repository ppa:maas/3.3-next
	sudo apt update -y
	sudo apt-get -y install maas -y
    fi
}


check-status() {
    show_msg "check-status"

    # systemctl status --no-pager | grep '.service' | grep maas
    for i in maas-regiond maas-syslog maas-proxy maas-http maas-rackd; do
	echo $i
	 systemctl status $i --no-pager
    done

    show_msg "check-status: done"
}

setup-admin() {
    show_msg "setup-admin"

    if sudo maas apikey --username maasadmin >/dev/null; then
	echo "Maas admin user exists"
    else
	cat <<EOF
	 Params I use for maas admin user:
	 - name: maasadmin
	 - pw: password (for testing)
	 - email: unused@email.com (since it is not used)
	 - gh:<github user> (since that is my github user and the local SSH key gives access to it)
EOF

	echo "Testing your SSH credentials to Github..."
	if ssh -T git@github.com 2>&1  | grep 'success'; then
	    echo "The user shown above has access to github, you can use 'gh:<github user>' in Maas"
	else
	    echo "Warning, this OS account is not set up to acccess github via SSH"
	fi

	sudo maas createadmin
    fi

    IP=$(hostname -i)
    xdg-open http://${IP}:5240/MAAS &>/dev/null
}

setup-networks() {
    show_msg "setup-networks"

    cat <<EOF
    # https://maas.io/docs/how-to-connect-maas-networks
    The default network, 'fabric0' should be created from the local subnet
EOF

    show_msg "setup-networks: done"

}

setup-dhcp() {
    show_msg "setup-dhcp"

    # https://maas.io/docs/how-to-enable-dhcp
    cat <<EOF
    Choose the default VLAN. Click on Maas -> subnets -> untagged
    My setup:
    Subnet: 192.168.8.0/24
    Mangement:
      - by default, the subnet is managed (i.e. Maas will provide DHCP)
      - To change the management of a subnet, see:
        - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716#heading--controlling-subnet-management
    IP Range: 192.168.8.191 - 192.168.8.254 (using static IPs in low range, for the Maas server itself)

    Review:
      - https://discourse.maas.io/t/how-to-manage-ip-ranges/5136
      - https://discourse.maas.io/t/maas-glossary/5416#heading--ip-ranges
      - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716
      - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716#heading--controlling-subnet-management
EOF

    show_msg "setup-dhcp: done"
}

test-dhcp() {
    show_msg "test-dhcp"

    if ! which dhcpcd >/dev/null; then
        sudo apt install dhcpcd5
    fi
    F=/tmp/dhcpcd.out
    sudo dhcpcd -T enp8s0 -t 2 &> $F # Specify expected NIC name
    echo "Scanning results of DHCP test at $F"
    echo "Look at the file via: cat $F"
    if cat $F | grep 'new_filename' | grep 'lpxelinux.0' >/dev/null; then
	echo "Looks good"
    fi

    show_msg "test-dhcp: done"
}


provision-vms-in-maas() {
    show_msg "provision-vms-in-maas"

    cat <<EOF
    # Add LXC "hosts/servers"
    # READ THIS
    #   https://maas.io/docs/how-to-manage-vm-hosts#heading--adding-a-vm-host
    # KEY POINT
    #   Add the LXD bridge gateway address
    #  "Enter the LXD address as the gateway address of the bridge for that LXD instance. For example, if lxdbr0 has address 10.4.241.0, the default gateway address is 10.4.241.1."
    # See:
    #   - lxc network show lxdbr0
    #   - ip a s dev lxdbr0 | grep 'inet ' | awk '{print $2}' | cut -d '/' -f 1


    ################################################################################
    # After the Machine/VM is created/compposed it will go to "Commissioning" state
    # In a minute or wo, it will turn off and go to the "Ready" state
    # At this point, the machine can be "Deployed"
    ################################################################################

    # To Deploy a machine
    # Maas -> Machines -> Select VM(s) -> Take Action -> Deploy

    # The LXC Servers/Hosts will appear as Machines, with a power state of "unknown"
    # These should not be provisioned, so make a pool for them
    # Put the LXC hosts in the other pool
    # Maas -> Machines -> <LXC host> -> Configuration -> Machine/Edit


    # The linux user name varies, depending on the OS/Image
    Log in via: ssh ubuntu@<IP=192.168.8.202>

EOF

    show_msg "provision-vms-in-maas: done"
}


################################################################################
# Call this to set up MaaS Server
################################################################################
setup_maas_server() {

    install-maas-via-kvm

    check-status

    setup-admin

    setup-networks

    setup-dhcp

    test-dhcp
}


setup_maas_server
