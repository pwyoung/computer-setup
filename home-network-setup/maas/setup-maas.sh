#!/usr/bin/bash

# Goal:
#   Setup Maas server and manage both bare-metal and virtual machines.
#
# Background
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


# Ideall, install on a bare metal server
install-maas-server() {
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
        echo "Maas admin user does not exist"

	echo "First, testing your SSH credentials to Github..."
	if ssh -T git@github.com 2>&1  | grep 'success'; then
	    echo "The user shown above has access to github, you can use 'gh:<github user>' in Maas"
	else
	    echo "Warning, this OS account is not set up to acccess github via SSH"
	fi

        cat <<EOF
	 Params I use for maas admin user:
	 - name: 'maasadmin'
	 - pw: 'password' (for testing)
	 - email: no@email.com (since it is not used)
	 - gh:<github user from above> (since that is my github user and the local SSH key gives access to it)
EOF
        show_msg "create maas admin user next"
	sudo maas createadmin
    fi

    IP=$(hostname -i)
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
      Reserved Range: Type=Reserved (not dynamic), 192.168.3.2 - 192.168.3.20, "For Static IPs"
      Reserved Range: Type=Dynamic, 192.168.3.100 - 192.168.3.200, "For enlisting, commisioning, and Maas-Managed DHCP"

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
    #
    NIC='enp86s0'
    #NIC='enp8s0'
    sudo dhcpcd -T $NIC -t 2 &> $F
    #
    echo "Scanning results of DHCP test at $F"
    echo "Look at the file via: cat $F"
    if cat $F | grep 'new_filename' | grep 'lpxelinux.0' >/dev/null; then
	echo "Looks good"
    else
        show_msg "Error, we didn't find a DHCP server. Is it running? Is the NIC ( $NIC ) correct?"
        exit 1
    fi

    show_msg "test-dhcp: done"
}


setup-maas-server() {

    install-maas-server

    check-status

    setup-admin

    setup-networks

    setup-dhcp

    test-dhcp
}

add-machines-to-maas() {
    show_msg "add-machines-to-maas"

    cat <<EOF
    # GOALS
    #   Add physical machines to Maas (which happen to have no BMC/OOB power-management)
    #   For some of these machines, let Maas configure them as KVM servers, connected to Maas, so that we can create VMs in them.
    #
    # REVIEW the "Maas Machine lifecycle"
    # - https://maas.io/docs/about-machines#heading--Introduction-to-the-machine-life-cycle
    # - https://discourse.maas.io/t/the-machine-lifecycle/6696
    #
    # Naming Conventions
    # - Before Deploying a machine, you can rename it in Maas
    # - I use a basic name for the physical host (e.g. 'dell' or 'mele' or '<some-hyphenated-IP-a-b-c-d>) and
    # - if the host is a Virsh server, I name the Virsh VMs '<virsh-host>-<vm-name>' to make it easy to see the relationship in Maas
    #
    # Steps:
      - Prepare DHCP:
      -   Make sure a Dynamic IP range is configured for the DHCP on the Subnet/VLAN with the machine.
      -   Manually add the machine, giving the power type "manual" and specifying the MAC address (and optionally, the name)
      -
      - Enlist a "New" machine (manually or via auto-discovery):
      -   Automatic Enlistment:
      -     Make sure the machine is not already in Maas. Delete it if it is.
      -     PXE-boot the machine.
      -     Watch the machine show up in Maas -> Machines -> Add Hardware -> Machine with a state of "New"
      -     Edit the Machine's config via Maas -> Machines -> <machine name> -> Configuration
      -     Set the power type (e.g. "manual" for no BMC, or AMT, etc)
      -     It is NOT strictly necessary to set a minimum kernel. Skip that and let the user specify it on deployment.
      -   Manual Enlistment:
      -     Maas -> Machines -> Add Hardware -> Machine
      -     Enter MAC, power-type ("manual" if there is no BMC), and optionally the name.
      -     The machine will show up with state "Commissioning"
      -     Flip on the power. Eventually it will show up as state "New"
      -
      - Commision the "New" machine to make it "Ready":
      -   Click on Maas -> Machines -> <machine name> -> Take Action
      -   You'll see, since there is only one machine selected, the GUI enforces that the only valid next state is "Commission", click that.
      -   The machine has a state of "Commissioning", but if this is a manually powered machine, you probably need to turn it on.
      -   The machine will PXE-boot until it says "Reached cloud-init target"
      -   In Maas, the machine's details will show green-checks for "Commissioning" and "Tests" and have a state "Ready"
      -
      - Allocate the "Ready" machine to yourself:
      -    Machines that are "Ready" are available for anyone to "Allocate" them to themselves.
      -    By logging in as a particular Maas (admin) user, and clicking "Allocate", that user becomes the owner of the machine.
      -    It's good Allocate the machine even if you already own it just to keep ownership in mind.
      -
      - You can "Deploy", or "Release" (un-allocate) a machine that is "Allocated" to you
      -
      - Deploy the "Allocated" machine
      -    Click Machines -> Filters -> Owners -> <your maas admin name>
      -    See your machine in the "Allocated" section
      -    Click the machine -> Take Action -> "Deploy"
      -    Choose options: OS, Release, cloud-init script, whether to configure as a KVM server, and so on.
      -    Click Start Deployment. The machine state will be "Deploying"
      -    Click on Logs -> Installation output.
      -      - The logs don't show anything at first. System is booting...
      -    Click on the general Maas -> Machines list and and optionally Filters -> Status -> Deploying to see the status with a spinner
      -
      - If the Machine is a KVM Host (used to create VM Machines)
      -   Go to Maas -> KVM -> Virsh to see the KVM host. The connection string should be like: "qemu+ssh://virsh@<ip-of-kvm-host>/system"
      -   Choose Take Action -> Compose VM
      -   The machine state will be "Deployed"
      -
      - Test a Machine (physical or virtual) that is running Ubuntu with something like: "ssh ubuntu@<machine-ip> hostname"
      - Other OSes use a different default user name than 'ubuntu'
EOF

}

#test-dhcp
setup-maas-server
add-machines-to-maas
