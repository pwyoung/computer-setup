#!/usr/bin/bash

# Note: basic steps per https://maas.io/docs/how-to-do-a-fresh-install-of-maas, via Packages

# Config file
CFG=./setup-maas.cfg

set_params() {
    if [ -f $CFG ]; then
        echo "Getting parameters from $CFG"
        source ./setup-maas.cfg
    else
        echo "$CFG does not exist. Using hard-code parameters"
        PROFILE='admin'
        EMAIL_ADDRESS='notused@notused.localhost'
        PASSWORD='admin'
        SSH_IMPORT='gh:pwyoung'
        API_HOST='192.168.2.192'
    fi
}

install_maas() {
    sudo apt update -y

    # Optional
    sudo apt upgrade -y

    VERSION_CODENAME=$(cat /etc/os-release  | grep VERSION_CODENAME | cut -d'=' -f 2)
    if [ "$VERSION_CODENAME" == "focal" ]; then
        sudo apt-add-repository ppa:maas/3.2 # Ubuntu 20.04
    elif [ "$VERSION_CODENAME" == "jammy" ]; then
        sudo apt-add-repository ppa:maas/3.3 # Ubuntu 22.04
    else
        echo "Unsuppored OS or version: $VERSION_CODENAME"
        exit 1
    fi

    sudo apt update -y

    # Optional
    sudo apt upgrade -y
    sudo apt autoremove -y

    #  Install region and rack controllers on this machine
    sudo apt-get -y install maas
}

check_maas_binary() {
    if which maas &>/dev/null; then
        #echo "maas is in PATH."
        return
    fi
    echo "Error: maas is not in PATH."

    # Check packages
    sudo apt list --installed 2>/dev/null | grep -i maas | cut -d'/' -f 1 | sort > /tmp/maas-installed-packages.txt
    cat <<EOF > /tmp/maas-expected-packages.txt
maas
maas-cli
maas-common
maas-dhcp
maas-proxy
maas-rack-controller
maas-region-api
maas-region-controller
python3-django-maas
python3-maas-client
python3-maas-provisioningserver
EOF
    if ! diff /tmp/maas-installed-packages.txt /tmp/maas-expected-packages.txt; then
        echo "The packages might not have been installed properly. Stop here to check the installation (version etc)"
    fi

    exit 1
}

check_maas_services(){
    PKGS=(maas-regiond maas-syslog maas-proxy  maas-http maas-rackd)
    for p in "${PKGS[@]}"; do
        echo $p
        systemctl status --no-pager $p | grep 'Active'
    done

}

add_maas_admin() {
    # sudo maas createadmin --username=$PROFILE --email=$EMAIL_ADDRESS

    if sudo maas apikey --username $PROFILE &>/dev/null; then
        echo "Profile=$PROFILE exists. Not creating user for profile $PROFILE"
    else
        echo "Creating user for profile $PROFILE. Enter the password first"
        #sudo maas createadmin --username=$PROFILE --email=$EMAIL_ADDRESS

        sudo maas createadmin --username=$PROFILE --email=$EMAIL_ADDRESS --password $PASSWORD --ssh-import $SSH_IMPORT
    fi
}


connect_to_maas() {
    # If there is a valid display, open a browser
    if xlsclients &>/dev/null; then
        open http://${API_HOST}:5240/MAAS
    else
        echo "No valid display. No opening browser to MAAS"
    fi
}

setup_maas() {
    set_params

    if ! which maas &>/dev/null; then
        echo "Installing MAAS"
        install_maas
    fi

    check_maas_binary

    check_maas_services

    add_maas_admin

    # Huh?
    # https://maas.io/docs/how-to-do-a-fresh-install-of-maas#heading--reinitialising-maas

    connect_to_maas
}

connect_to_maas
#setup_maas
