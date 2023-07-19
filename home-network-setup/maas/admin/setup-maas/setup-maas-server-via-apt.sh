#!/usr/bin/bash

# Goal:
#   Idempotent script that will set up a Maas server
#
# Background
#   This uses Ubuntu OS (APT) packages and is tested on bare-metal
#   Prefer KVM over LXD since:
#     - KVM supports GUIs (see: virt-manager, virt-viewer, gnome-boxes, etc)
#     - Maas will configure a machine from PXE-boot into a working, connected KVM server.
#     - KVM is popular among RedHat and other distros
#   KVM is not fully supported with multipass.
#      Specifically, multipass only supports the '--network' command on LXD
#      The '--network' command is needed to connect to a bridge in order to provide a static IP
#      The static IP of the brige needs to be given to the Maas server to let maas provision VMs.
#   Maas is popular among Banks and Telcos and other folks running private clouds.
#   Maas can be set up using Docker, and even run on K8S (via a bridge),
#     e.g. via https://github.com/att-comdev/dockerfiles/blob/master/maas/docker-compose.yml

show_msg() {
    MSG="$1"

    echo "================================================================================"
    echo "${MSG}"
    echo "================================================================================"

    read  -n 1 -p "Hit any key" invar

    # Sleep X seconds
    sleep 0.1
}


prepare-maas-server-networking() {
    cat <<EOF
    Configure Maas Networking
    Steps:
    - Install the latest stable (Ubuntu) OS
    - For simplicity, Maas will be the DHCP server (although apparently other configs are possible) so...
      - Turn off any DHCP servers on the subnet-VLAN that Maas will control
      - Set up static networking for the Maas Server on the interface/subnet that Maas will control
        - Example:
          - Ubuntu -> Activities -> Settnigs -> Network
            - Address/IP=192.168.3.6
            - Netmask=255.255.255.0
            - Gateway=192.168.3.1
      	    - DNS=8.8.8.8,1.1.1.1,9.9.9.9,192.168.3.6  # Tell this host to also use itself for DNS   # Turn automatic DNS off
            - Routes: <none set>    # Turn automatic Routes off

    NOTES
    - If the Maas server also has additional interfaces, e.g. WIFI, that's ok, Maas will not automatically
      run DHCP on any subnet/VLAN. DHCP activation is subnet specific and set up by you in the UI.
EOF
    show_message "Make sure networking is set up per something like above"
}

# Ideally, install on a bare metal server
install-maas-server() {
    if which maas >/dev/null; then
	echo "Command 'maas' is in PATH. Assuming it is installed properly."
    else
	cat <<EOF
	Installing Maas per https://maas.io/docs/how-to-do-a-fresh-install-of-maas
	Using package repository as opposed to snap
EOF
	sudo apt-add-repository ppa:maas/3.3-next
	sudo apt update -y
	sudo apt-get -y install maas -y
    fi
    sudo apt list --installed 2>&1 | egrep '^maas/'
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
	echo "Maas user 'maasadmin' exists"
    else
        echo "Maas user 'maasadmin' does not exist"

        cat <<EOF
	 Params I use for maas admin user:
	 - maas-user-name: "maasadmin"
	 - maas-user-pw: "<maas-user-name>"   (for testing)
	 - maas-user-email: "<maas-user-name>email.com"   (since it is not used, but must be unique)
	 - maas-user-ssh-key-name: "gh:<github-user>"   (since I prefer to use Github users to Launchpad)

	Note:
          Above, the 'gh:<github-user>' is used by maas to fetch a public SSH key (using 'ssh-import-id')
	  You can manually add SSH keys to a Maas user in the Maas web-ui.

	General maas user setup is descibed here: https://maas.io/docs/how-to-manage-user-accounts

	Calling 'sudo maas createadmin' now
EOF
        show_msg "Create maas admin user next."
	sudo maas createadmin
    fi

    IP=$(hostname -i)
    echo "Opening Maas UI in browser at: http://${IP}:5240/MAAS"
    xdg-open http://${IP}:5240/MAAS &>/dev/null
}

setup-networks() {
    show_msg "setup-networks"

    cat <<EOF
    If you are using a VLAN, it should be detected by Maas, but confirm that in Maas -> Subnets.
EOF

    show_msg "setup-networks: done"

}

setup-default-network-with-dhcp() {
    show_msg "setup-dhcp"

    # https://maas.io/docs/how-to-enable-dhcp
    cat <<EOF
    # https://maas.io/docs/how-to-connect-maas-networks
    The default network, 'fabric0' will be created from the local subnet
    At home, this has no VLAN, so it is "untagged", with VLAN ID=0

    Choose the default VLAN. Click on Maas -> subnets -> "untagged"
    My setup:
      Subnet: 192.168.3.0/24
      Reserved Range: Type=Dynamic, 192.168.3.191 - 192.168.3.254  NOTE/Purpose:"For enlisting, commisioning, and Maas-Managed DHCP"

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
    echo "" > $F
    NIC=$(ip a s | grep 'enp' | awk '{print $2}' | tr -d ':')
    show_msg "Testing DHCP client on NIC=$NIC"
    sudo dhcpcd -T $NIC -t 2 &> $F
    #
    echo "Scanning results of DHCP test at $F"
    echo "Look at the file via: cat $F"
    if cat $F | grep 'new_filename' | grep 'lpxelinux.0' >/dev/null; then
	echo "Looks good."
    else
        show_msg "Error, we didn't find a DHCP server. Is it running? Is the NIC ( $NIC ) correct?"
        exit 1
    fi

    show_msg "test-dhcp: done"
}

important-configuration() {
    cat <<EOF
    AFTER INITIAL MAAS SETUP:
    - Update the Commissioning OS to the latest Ubuntu OS Version
      Maas failed to utilize (pxe-boot -> enlist/commision) a newer piece of hardware until I
      updated the OS/Kernel used for Commissioning in:
      Maas -> Settings -> Commissioning -> Default Ubuntu release used for commissioning
    - Add Maas Users
      They will be admins, but when they log in with their own username/password two things happen:
      - Machines they Allocate will be Owned by them. This is important for tracking.
      - Machines they Deploy will get their SSH keys installed.
    - Add Maas machines. See the other doc (add-maas-baremetal-and-virtual-machines.sh) for that
EOF

}

setup-maas-server() {
    prepare-maas-server-networking

    install-maas-server

    check-status

    setup-admin

    setup-networks

    setup-dhcp

    test-dhcp

    important-configuration
}

#test-dhcp
setup-maas-server
