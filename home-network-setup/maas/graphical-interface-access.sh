#!/usr/bin/bash

graphical-login-options() {


    cat <<EOF
      - Linux
        - To add a graphical desktop, decide if it's really necessary. There are many options for that.
          - Light-weight desktop: You can use XFCE
          - Gnome (minimal or full): https://linuxconfig.org/how-to-install-gnome-on-ubuntu-22-04-lts-jammy-jellyfish
        - Test with full Ubuntu Desktop, using SSH to the KVM server
          - sudo apt install ubuntu-desktop # On the KVM server (for testing without SSH)
          - sudo apt install ubuntu-desktop # On the KVM server (to add full Gnome desktop and related apps to Ubuntu)
          - Configure the KVM server for full X11 forwarding:
            - /etc/ssh/sshdconfig: "X11Forwarding yes" and "X11DisplayOffset 10"
          - Run "ssh -X ubuntu@<kvm-server> virt-viewer" or "ssh -X ubuntu@<kvm-server> virt-manager"

      - For windows RDP, you might need to redirect the RDP port via:
        - virsh qemu-monitor-command --hmp windows7 'hostfwd_add ::13389-:3389'

      - Consider Quacamole
         - Quacamole OS packages are old, but the project is alive, and most people seem to use Docker
         - To install via Docker
           - e.g. https://theko2fi.medium.com/apache-guacamole-manual-installation-with-docker-compose-222cef1894e3
           - This shows how to configure with SSL/TLS and OpenId protected connections

EOF

}


add-machines-to-maas
