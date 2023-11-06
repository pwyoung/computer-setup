#!/bin/bash

# GOAL: Set up a new PopOS machine
#
# STATUS:
#   This installs Docker-CE and sets up Nvidia-GPU support for containers in it.

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
# Python Dev
PKGS+=" python-is-python3 python3-venv"

# For local certs, esp on K8S
# https://github.com/cloudflare/cfssl
PKGS+=" golang-cfssl"

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


# Call this before installing docker
purge_all_docker() {
    read -p "Press enter to NUKE/PURGE ALL DOCKER IMPLEMENTATIONS!"

    ~/bin/purge-docker.sh
}


docker_ce() {
    if command -v podman; then
        echo "Podman is installed. Removing any old docker implementations first"
        purge_all_docker
    fi

    if docker --version; then
        echo "Docker is already installed"
        return
    fi

    echo "Install Docker-CE"
    echo "Per https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository"

    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg

    if [ ! -e /etc/apt/keyrings/docker.gpg ]; then
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    if [ ! -e /etc/apt/sources.list.d/docker.list ]; then
        echo \
            "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    fi

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    if ! groups | grep docker; then
        echo "Adding $USER to docker group"
        sudo usermod -aG docker $USER
        echo "Exiting: Log in again"
        exit 1
    fi

}

install_some_docker() {

    # No, uses VM, use this on Mac/Windows
    # Might not support CDI
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-device-interface-cdi-support
    #
    # NOPE: It is not really meant to run on Ubuntu/PopOS -> due to RedHat/Canonical community mutual snubbing.
    # https://github.com/containers/podman/issues/11665
    # In a nutshell:
    # - podman devs have no interest in doing work to support Ubuntu (since they report but do not implement the manual solution)
    # - Ubuntu doesn't care to support podman (since it has no gvproxy package)
    #
    # NOTE:
    # - Rancher is probably a better tool, supported by a company that supports FOSS, e.g. makes K3S, and things just work everywhere.
    #podman_desktop

    # No, uses VM, use this on Mac/Windows
    # Might not support CDI
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-device-interface-cdi-support
    #rancher_desktop

    # ***Give up on Podman on PopOS/Ubuntu (neither is officially supported w/podman)
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-runtimes
    # setup_podman

    # Does not (explicitly) support CDI
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-device-interface-cdi-support
    # But this seems to be supported in general
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#setting-up-docker
    docker_ce

    # Test it
    # sudo docker run hello-world
    docker run hello-world
}


# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#step-1-install-nvidia-container-toolkit
setup_nvidia_for_docker_ce() {

    echo "step 1"
    sudo apt-get update \
        && sudo apt-get install -y nvidia-container-toolkit-base

    nvidia-ctk --version

    echo "step 2"
    if [ ! -e /etc/cdi/nvidia.yaml ]; then
        sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
    fi
    grep "  name:" /etc/cdi/nvidia.yaml


    echo "step 3"
    curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
    distro=$(. /etc/os-release;echo $ID$VERSION_ID)
    # PopOS is compatible with Ubuntu (packages etc)
    distro=$(echo $distro | perl -pe 's/pop/ubuntu/')
    curl -s -L https://nvidia.github.io/libnvidia-container/$distro/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

    sudo apt-get update
    sudo apt-get install -y nvidia-container-toolkit
    # configure docker daemon to recognize Nvidia runtime
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    # Check this
    docker info | grep -i runtimes | grep -i nvidia

    echo "# Test"
    F1=/tmp/nvidia-smi.host
    F2=/tmp/nvidia-smi.container
    nvidia-smi | tee $F1
    sudo docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi | tee $F2
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda nvidia-smi # fails, no latest version
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi # Works
    echo "Show nvidia-smi differences between host and container"
    diff $F1 $F2 || true


    # Cleanup
    # Get rid of deprecation warnings
    # Per https://itsfoss.com/key-is-stored-in-legacy-trusted-gpg/
    if sudo apt update | egrep '^W:' | grep 'Key is stored in legacy trusted.gpg keyring'; then
        #W: https://nvidia.github.io/libnvidia-container/stable/deb/amd64/InRelease: Key is stored in legacy trusted.gpg keyring (/etc/apt/trusted.gpg), see the DEPRECATION section in apt-key(8) for details.
        #W: https://nvidia.github.io/libnvidia-container/stable/ubuntu18.04/amd64/InRelease: Key is stored in legacy trusted.gpg keyring (/etc/apt/trusted.gpg), see the DEPRECATION section in apt-key(8) for details.
        sudo cp /etc/apt/trusted.gpg /etc/apt/trusted.gpg.d
        sudo apt update
    fi

    # Docker-CE does not support CDI (K8S does not love Docker-CE in general...)
    #
    # Run containers as non-root. Do NOT use this for containers running as root (as they will fail)
    #F=/etc/cdi/nvidia.yaml # Docs
    #
    # Show files owned by Nvidia packages that are installed on this system
    # rm /tmp/x; for i in $(sudo apt list --installed 2>/dev/null| grep nvidia | grep jammy | cut -d'/' -f 1); do echo $i; dpkg -L $i |tee -a /tmp/x; done && emacs /tmp/x
    #F=/etc/nvidia-container-runtime/config.toml
    #sudo sed -i 's/^#no-cgroups = false/no-cgroups = true/;' $F


    # Test with Pytorch
    # https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch
    # https://docs.nvidia.com/deeplearning/frameworks/support-matrix/index.html
    # docker run --gpus all -it --rm nvcr.io/nvidia/pytorch:23.08-py3 # Memory too low error
    #
    # stack=67108864=64MB
    docker run --gpus all --ipc=host --ulimit memlock=-1 --ulimit stack=67108864 -it --rm nvcr.io/nvidia/pytorch:23.08-py3 hostname
}

# Support this user running "user sessions" with KVM/Qemu
# See: https://mike42.me/blog/2019-08-how-to-use-the-qemu-bridge-helper-on-debian-10
#
# See: https://www.linuxtechi.com/how-to-install-kvm-on-ubuntu-22-04/
configure_qemu_helper() {
    # This didn't exist
    sudo mkdir -p /etc/qemu
    sudo chown root /etc/qemu
    sudo chmod 0755 /etc/qemu

    echo 'allow virbr0' | sudo tee /etc/qemu/bridge.conf
    sudo chown root.$USER /etc/qemu/bridge.conf
    sudo chmod 0664 /etc/qemu/bridge.conf
    #
    sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
    #
    sudo chgrp $USER /etc/qemu/bridge.conf

    if ! systemctl status libvirtd.service | grep 'active (running)'; then
        cat <<EOF
        # Setup libvirt daemon
        systemctl enable libvirtd.service
        systemctl start libvirtd.service
EOF
        exit 1
    fi

    if ! ip addr show virbr0 | grep '192.168.122.1'; then
        cat <<EOF
        # Create "virbr0" as the default bridge for Libvirt/KVM/Qemu
        sudo virsh net-autostart --network default
        sudo virsh net-start --network default
EOF
        exit 1
    fi

}

setup_ansible() {
    if ! ansible-galaxy --version; then
        sudo apt install software-properties-common -y
        sudo apt-add-repository ppa:ansible/ansible
        sudo apt update -y
        sudo apt install ansible -y
        ansible --version
        ansible-galaxy --version
    fi
}

misc() {
    # SSH
    if [ ! -e ~/.ssh/id_ed25519 ]; then
        echo "Make ed25519 SSH key"
        ssh-keygen -o -a 100 -t ed25519 -f ~/.ssh/id_ed25519
    fi

    # Timeshift
    if ! command -v timeshift-gtk; then
        sudo apt-add-repository -y ppa:teejee2008/ppa
        sudo apt-get update
        sudo apt-get install timeshift
    fi

    # VSCODE
    if ! command -v code; then
        echo "Get VSCODE from https://code.visualstudio.com/Download"
        echo "Check extensions here: https://marketplace.visualstudio.com/vscode"
        google-chrome https://code.visualstudio.com/Download#
        exit 1
    fi

    # SSH
    sudo apt-get install -y openssh-server
    sudo systemctl enable ssh --now

    # For Nvidia/Nemo
    # https://medium.com/analytics-vidhya/installing-any-version-of-cuda-on-ubuntu-and-using-tensorflow-and-torch-on-gpu-b1a954500786
    sudo apt-get install -y nvidia-cuda-toolkit
    sudo apt list -a cuda=12.1.0.1
    sudo apt list -a cuda=12.3.0.1

}


preferences() {
    # Speed up animations
    gsettings set org.gnome.desktop.interface enable-animations false

}

main() {
    install_packages

    setup_symlinks

    # Nvidia has only been successfully run with Docker-CE
    # Specifically, podman on Ubuntu failed (is a semi-supported nightmare)
    #install_some_docker
    docker_ce
    docker run hello-world
    setup_nvidia_for_docker_ce

    configure_qemu_helper

    setup_ansible

    misc
}

main
#configure_qemu_helper
