#!/bin/bash

# GOAL:
# - Set up a new Ubuntu machine
# - This excludes things it used to include:
#   - the stuff needed for nomaj
#     https://github.com/pwyoung/nomaj
#   - This does not install Docker

set -e

# Path to where we installed https://github.com/pwyoung/computer-setup
# If this exists, this program will create some convenient symlinks
COMPUTER_SETUP=~/git/computer-setup

# Things to symlink (from $COMPUTER_SETUP)
SYMLINKS=".bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"

# Convenient packages to have
PKGS="emacs-nox tree glances htop dmidecode iotop openssh-server python3-pip"

# Additional Packages
# Track things installed over time
PKGS="python3-venv"

install_packages() {
    sudo apt update
    sudo apt install -y $PKGS
    sudo apt autoremove -y
}

report() {
    echo "$1"
}

make_link() {
    TGT=$1
    SRC=$2
    report "INFO: Considering link to $TGT from $SRC"
    if [ -s $SRC ]; then
	report "WARNING: Source $SRC already exists"
	mv -f $SRC $SRC.MOVED
    fi
    if [ ! -e $TGT ]; then
	report "ERROR: Target $TGT does not exist."
	exit
    fi
    report "INFO: Making link to $TGT from $SRC"
    ln -s $TGT $SRC
}

setup_symlinks() {
    D=$COMPUTER_SETUP/home
    if test -d $D; then
        report "Directory $D exists"
        cd ~/
        for i in $SYMLINKS; do
	    make_link $D/$i ~/$i
        done
    else
        report "Directory $D does not exist. Skipping symlink setup"
	exit 1
    fi

    report "Setting exec perms on our directories"
    chmod +x ~/bin/*
    chmod +x ~/.profile.d/*
}

misc() {

    # KUBECTL
    mkdir -p ~/bin-local
    cd ~/bin-local
    if [ ! -e ./kubectl ]; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    fi
    if [ ! -e ./helm ]; then
        F=helm-v3.13.2-linux-amd64.tar.gz
        wget https://get.helm.sh/$F
        tar xvzf ./$F
        mv ./linux-amd64/helm ./
    fi

    # Speed up animations
    if command -v gsettings; then
	gsettings set org.gnome.desktop.interface enable-animations false
    fi

    # Flatpak
    echo "TODO: https://flatpak.org/setup/Ubuntu"

    # VSCODE
    if ! command -v code; then
        echo "TODO: Get VSCODE from https://code.visualstudio.com/Download"
        #google-chrome https://code.visualstudio.com/Download#
        #exit 1
    fi
}

allow_passwordless_sudo() {
    read -p "Enter 'Y' to set up passwordless sudo for user $USER. Or enter to skip" X
    if [ "$X" == "Y" ]; then
	F=/etc/sudoers.d/$USER
	echo "$USER ALL=(ALL:ALL) NOPASSWD: ALL" | sudo tee $F
	sudo chmod 0400 $F
    fi
}


main() {
    allow_passwordless_sudo
    install_packages
    setup_symlinks
    misc
}

main
