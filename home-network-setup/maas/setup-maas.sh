#!/usr/bin/bash


maas-server-requirements() {
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
    if which maas >/dev/null; then
	echo "Maas is in PATH. Assuming it is installed properly."
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
    echo "Checling Maas services"
    # systemctl status --no-pager | grep '.service' | grep maas
    for i in maas-regiond maas-syslog maas-proxy maas-http maas-rackd; do
	echo $i
	 systemctl status $i --no-pager
    done
}

setup-admin() {
    if sudo maas apikey --username maasadmin >/dev/null; then
	echo "Maas admin user exists"
    else
	sudo maas createadmin
	# name: maasadmin
	# pw: password
	# email: notused@email.com
	# gh:pwyoung
    fi

    IP=$(hostname)
    xdg-open http://${IP}:5240/MAAS
}

setup-networks() {
    # https://maas.io/docs/how-to-connect-maas-networks
    cat <<EOF
    The default network, 'fabric0' should be created from the local subnet

EOF

}

setup-dhcp() {
    # https://maas.io/docs/how-to-enable-dhcp
    cat <<EOF
    Choose the default VLAN. Click on Maas -> subnets -> untagged
    My setup:
    Subnet: 192.168.8.0/24
    Mangement:
      - by default, the subnet is managed (i.e. Maas will provide DHCP)
      - To change the management of a subnet, see:
        - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716#heading--controlling-subnet-management
    IP Range: 192.168.8.100 - 192.168.8.200 (using static IPs in low range, for the Maas server itself)

    Review:
      - https://discourse.maas.io/t/how-to-manage-ip-ranges/5136
      - https://discourse.maas.io/t/maas-glossary/5416#heading--ip-ranges
      - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716
      - https://discourse.maas.io/t/subnet-management-deb-3-0-cli-test/4716#heading--controlling-subnet-management


EOF
}

test-dhcp() {
    if ! which dhcpcd >/dev/null; then
        sudo apt install dhcpcd5
    fi
    F=/tmp/dhcpcd.out
    sudo dhcpcd -T enp8s0 -t 2 &> $F #| tee $F
    echo "Scanning results of DHCP test at $F"
    echo "Look at the file via: cat $F"
    if cat $F | grep 'new_filename' | grep 'lpxelinux.0' >/dev/null; then
	echo "Looks good"
    fi

}

setup-lxd-host() {
    cat <<EOF
    Run this on the machine providing the LXC virtual host    
    https://maas.io/docs/how-to-set-up-lxd

    Created default everything, but
    storage pool has type "dir" (per docs above)
    no connection to maas automatically
    yes, expose to network

    # Do not add another DHCP or DNS server
    lxc network set lxdbr0 dns.mode=none
    lxc network set lxdbr0 ipv4.dhcp=false
    lxc network set lxdbr0 ipv6.dhcp=false

    # IP: 192.168.8.100 (DHCP)
    # LXC bridge
    #  lxc network show lxdbr0
    # 10.25.155.1
EOF
}

provision-vms-in-maas() {
    cat <<EOF    
    Provision the KVM/LXC host in Maas

    Add VMs on top of the LXC host

    Allocate the VMs 

    Commision the VMs

    Deploy the VMs

    Log in via: ssh ubuntu@<IP=192.168.8.202>

EOF
}

#Uncomment to run one step at a time
#check-status
#exit 1

maas-server-requirements
install-maas
check-status
setup-admin
setup-networks
setup-dhcp
test-dhcp
setup-lxd-host
provision-vms-in-maas
