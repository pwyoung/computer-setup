#!/usr/bin/bash


show_msg() {
    MSG="$1"

    echo "================================================================================"
    echo "${MSG}"
    echo "================================================================================"

    read  -n 1 -p "Hit any key" invar

    # Sleep X seconds
    sleep 0.1
}

maas-server-requirements() {
    show_msg "maas-server-requirements"

   cat <<EOF
 Maas Server Requirements (single-node running all services)
 - https://maas.io/docs/installation-requirements
 - OS: Ubuntu 22.04 (was used and the latest stable version runs on it)
 - RAM: 8 GB RAM
 - CPU: 8 GHz
 - DISK: 100-200 GB (50 recommended, plus more for downloaded images)
EOF
}


# Install Maas to this host directly, using OS packages
install-maas-via-os-packages() {
    show_msg "install-maas"

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

# Install LXD and make a container to run Maas
# https://discourse.maas.io/t/install-with-lxd/757
#install-maas-via-lxd() {
#    show_msg "Follow the steps below on the maas server"
#
#    cat <<EOF
#    # https://discourse.maas.io/t/install-with-lxd/757
#    sudo snap install lxd
#
#    lxd init # Took defaults, but storage type is dir
#
#    #  Deactivate DHCP and DNS
#    lxc network set lxdbr0 dns.mode=none
#    lxc network set lxdbr0 ipv4.dhcp=false
#    lxc network set lxdbr0 ipv6.dhcp=false
#    lxc network show lxdbr0
#
#    # Set up a network for things like libvirt KVMs
#    lxc profile copy default maas-profile
#    lxc profile device set maas-profile eth0 network lxdbr0
#
#    # Make a container to run Maas. Launch with '--profile maas-profile'for the network for maas
#    # lxc launch --profile maas-profile ubuntu:20.04 focal-maas
#    # lxc exec focal-maas bash
#    # Use ubuntu 22.04 (for Maas 3.3)
#    lxc launch --profile maas-profile ubuntu:22.04 jammy-maas
#    # Run the container and install maas to is
#    lxc exec jammy-maas bash
#
#    # Install Maas per https://maas.io/docs/how-to-do-a-fresh-install-of-maas
#    # via <3.3 packages> (as opposed to snap)
#    if which maas >/dev/null; then
# 	echo "Command 'maas' is in PATH. Assuming it is installed properly."
#    else
# 	sudo apt-add-repository ppa:maas/3.3-next
# 	sudo apt update -y
# 	sudo apt-get -y install maas -y
#    fi
#EOF
#
#    show_msg "the server should be running now"
#
#}

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

setup-lxd-servers() {
    show_msg "setup-lxd-servers - NOT ON MAAS SERVER (IF IT WAS INSTALLED OUTSIDE LXD) - Directions only..."

    cat <<EOF
    Run this on each  machine providing the LXC virtualization service
    https://maas.io/docs/how-to-set-up-lxd

    # Install LXD from SNAP, not OS Packages
    #
    #sudo apt-get purge -y *lxd* *lxc*
    #sudo apt-get autoremove -y
    sudo snap install lxd
    sudo snap refresh

    # Initialize LXD
    # https://maas.io/docs/how-to-set-up-lxd#heading--lxd-init
    # Options for 'lxd init':
    # - no clustering
    # - create default storage pool of type 'dir'
    # - NO, do not connect to Maas server now (we need to turn off DHCP etc first)
    # - YES, make the lxc server available over the network
    sudo lxd init

    # Make sure LXD is not providing DHCP
    #
    lxc network set lxdbr0 dns.mode=none
    lxc network set lxdbr0 ipv4.dhcp=false
    lxc network set lxdbr0 ipv6.dhcp=false
    lxc network show lxdbr0

EOF

    show_msg "setup-lxd-servers: done"
}

check-dhcp-and-dns-in-lxc-server() {
    show_msg "Check that DHCP is off for the LXC server"

    cat <<EOF
    # Run these blocks in the LXC server

    if lxc network show lxdbr0 | grep 'dhcp' | grep 'false' | wc -l | grep 2 >/dev/null; then
	echo "DHCP is not running in LXC"
    else
	show_msg "ERROR: DHCP might be running in LXC"
    fi

    if lxc network show lxdbr0 | grep 'dns' | grep 'none' | wc -l | grep 1 >/dev/null; then
	echo "DNS is not running in LXC"
    else
	show_msg "ERROR: DNS might be running in LXC"
    fi
EOF

    show_msg "Check that DHCP is off for the LXC server: done"

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

    # Read up on Maas projects
    # https://maas.io/docs/how-to-set-up-lxd#heading--projects-tutorial
EOF

    show_msg "provision-vms-in-maas: done"
}

purge_lxd_snap() {
    echo "Remove VMs"
    V=$(lxc list | grep 'VIRTUAL' | cut -d' ' -f 2 | tr '\n' ' ')
    echo "VMs: ${V}"
    for i in $V; do
        lxc delete $i --force
    done
    lxc list
    show_msg "VMs should be gone now"

    echo "Remove images"
    # TODO
    lxc image list
    show_msg "Images should be gone now"

    echo "Remove networks"
    if lxc network list | egrep 'YES' | wc -l | grep 0; then
	echo "no networks"
    else
	lxc network detach-profile lxdbr0 default
	lxc network delete lxdbr0
    fi
    #N=$(lxc network list | egrep 'YES' | cut -d' ' -f 2 | tr '\n' ' ')
    #for i in $V; do
    #    lxc network delete $i --force-local
    #done
    lxc network list
    show_msg "MANAGED networks should be gone now"

    echo "Remove volumes"
    V=$(lxc storage volume list default | egrep 'maas' | cut -d' ' -f 4 | tr '\n' ' ')
    for i in $V; do
        lxc storage volume delete default $i #--force-local
    done
    # lxc storage delete default # Fails, lying that this is in use
    # lxd sql global "SELECT * FROM storage_volumes;"
    show_msg "Volumes should be gone"

    echo "Remove lxd snap"
    #sudo snap remove lxd
    sudo snap remove --purge lxd # Needed for one box... Maybe this is all that is needed?
}

################################################################################
# Call this to set up MaaS Server
################################################################################
setup_maas_server() {
    maas-server-requirements

    install-maas-via-os-packages

    #purge_lxd_snap # For clean install
    #install-maas-via-lxd

    check-status

    setup-admin

    setup-networks

    setup-dhcp

    test-dhcp
}

################################################################################
# Steps to set up an LXD host to provide VMs for use by Maas
################################################################################
setup_maas_lxd_hosts() {
    setup-lxd-servers
    check-dhcp-and-dns-in-lxc-server
    provision-vms-in-maas
}


setup_maas_server
