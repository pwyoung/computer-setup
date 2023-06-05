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

install-maas() {
    show_msg "install-maas"
    
    if which maas >/dev/null; then
	echo "Command 'maas' is in PATH. Assuming it is installed properly."
    else
	cat <<EOF
	Installing Maas per https://maas.io/docs/how-to-do-a-fresh-install-of-maas
	via <3.3 packages> (as opposed to snap)
EOF
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
}

test-dhcp() {
    show_msg "test-dhcp"
    
    if ! which dhcpcd >/dev/null; then
        sudo apt install dhcpcd5
    fi
    F=/tmp/dhcpcd.out
    sudo dhcpcd -T enp8s0 -t 2 &> $F 
    echo "Scanning results of DHCP test at $F"
    echo "Look at the file via: cat $F"
    if cat $F | grep 'new_filename' | grep 'lpxelinux.0' >/dev/null; then
	echo "Looks good"
    fi

}

setup-lxd-servers() {
    show_msg "setup-lxd-servers - NOT ON MAAS SERVER (IF IT WAS INSTALLED OUTSIDE LXC) - Directions only..."
    
    cat <<EOF
    Run this on each  machine providing the LXC virtualization service
    https://maas.io/docs/how-to-set-up-lxd

    # Install LXD from SNAP, not OS Packages
    sudo apt-get purge -y *lxd* *lxc*
    sudo apt-get autoremove -y
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
    lxc network show lxdbr0
    lxc network set lxdbr0 dns.mode=none
    lxc network set lxdbr0 ipv4.dhcp=false
    lxc network set lxdbr0 ipv6.dhcp=false
    lxc network show lxdbr0

    # IP: 192.168.8.100 (DHCP)
    # LXC bridge
    #  lxc network show lxdbr0
    # 10.25.155.1

EOF

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
    

}

provision-vms-in-maas() {
    show_msg "provision-vms-in-maas"
    
    cat <<EOF    
    # Add LXC "hosts/servers"
    Go to Maas -> KVM -> LXD -> Add LXC Host
    Add the IP of the LXC server
    Generate new certificate
    Copy the command to run on the LXD Server
    Run the command to add the cert to the LXD Server
    Click on Maas 'Check Authentication'
    Add the Host to a project ('default' or make one)

    # Create VMs from LXC hosts
    Maas -> KVM -> <some LXC host name> -> scroll down to 'add VM' 
    
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
}

#Uncomment to run one step at a time
#check-dhcp-and-dns-in-lxc-server
#exit 1

maas-server-requirements
install-maas
check-status
setup-admin
setup-networks
setup-dhcp
test-dhcp
setup-lxd-servers
check-dhcp-and-dns-in-lxc-server
provision-vms-in-maas
