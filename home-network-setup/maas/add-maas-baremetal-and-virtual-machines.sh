#!/usr/bin/bash

# Goal:
#   Setup Maas bare-metal and virtual machines.

show_msg() {
    MSG="$1"

    echo "================================================================================"
    echo "${MSG}"
    echo "================================================================================"

    read  -n 1 -p "Hit any key" invar

    # Sleep X seconds
    sleep 0.1
}


add-machines-to-maas() {
    show_msg "add-machines-to-maas"

    cat <<EOF
    # GOALS
    #   Add bare-metal machines to Maas (which happen to have no BMC/OOB power-management)
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


add-machines-to-maas
