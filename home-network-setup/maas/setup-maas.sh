#!/usr/bin/bash

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
	# email: notused@gmail.com
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

check-status
exit 1

install-maas
check-status
setup-admin
setup-networks
setup-dhcp
test-dhcp
