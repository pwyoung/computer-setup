#!/bin/bash
# GOAL: Set up a new PopOS machine with at least the requirements needed for nomaj

set -e

# Path to where we installed https://github.com/pwyoung/computer-setup
# If this exists, this program will create some convenient symlinks
COMPUTER_SETUP=~/git/computer-setup

# Things to symlink (from $COMPUTER_SETUP)
SYMLINKS=".bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"

# Convenient packages to have
PKGS="emacs-nox tree glances htop dmidecode"
# KVM/QEMU with a two options for GUIs
PKGS+=" gnome-boxes virt-manager"
# For NOMAJ
PKGS+=" python3-pip vagrant "
# For WSL2
PKGS+=" xdg-utils"
# For XFS
PKGS+=" xfsprogs"

install_packages() {
    sudo apt update
    sudo apt install -y $PKGS
}

report() {
    echo "$1"
}

make_link() {
    TGT=$1
    SRC=$2
    report "INFO: Considering link to $TGT from $SRC"
    if [ -s $SRC ]; then
	report "WARNING: Source $SRC already exists. Skipping"
	return
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

podman() {
    if ! which podman; then
	echo "installing podman"
	echo "Per https://podman.io/docs/installation#debian"
	sudo apt-get install -y podman

        # https://www.redhat.com/sysadmin/podman-docker-compose
        #   Emulate docker with podman
        sudo apt-get install -y podman-docker
        #   For Docker-Compose
        sudo apt-get install -y docker-compose

	echo "test"
	podman run -it docker.io/library/busybox
    fi
}

# NOPE: It is not really meant to run on Ubuntu/PopOS -> due to RedHat/Canonical community mutual snubbing.
# https://github.com/containers/podman/issues/11665
# In a nutshell:
# - podman devs have no interest in doing work to support Ubuntu (since they report but do not implement the manual solution)
# - Ubuntu doesn't care to support podman (since it has no gvproxy package)
#
# NOTE:
# - Rancher is probably a better tool, supported by a company that supports FOSS, and it just works everywhere.
podman_desktop() {
    if ! flatpak info io.podman_desktop.PodmanDesktop &>/dev/null; then
	echo "Install podman desktop"
	echo "Per https://podman-desktop.io/docs/Installation/linux-install"
	flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
	flatpak install --user flathub io.podman_desktop.PodmanDesktop

        cat <<EOF
        # Podman machine setup
        podman machine list
        # podman machine rm
        podman machine init
        podman machine start
EOF
        echo "stop here"
        exit 1
    fi
}

rancher_desktop() {
    if ! which docker | grep '.rd/bin/docker'; then
	    echo "Install Rancher Desktop"
	    echo "Per https://docs.rancherdesktop.io/getting-started/installation/#linux"
	    exit 1
    fi
}

docs() {
    cat <<EOF
  # SSH
  ssh-keygen -o -a 100 -t ed25519 -f ~/.ssh/id_ed25519

  # Timeshift
  sudo apt-add-repository -y ppa:teejee2008/ppa
  sudo apt-get update
  sudo apt-get install timeshift

  # KVM/QEMU
  https://www.linuxtechi.com/how-to-install-kvm-on-ubuntu-22-04/
EOF
}

#install_packages
setup_symlinks
podman
podman_desktop
rancher_desktop
