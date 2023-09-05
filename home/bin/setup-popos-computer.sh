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

################################################################################
# START: NOT-USED
################################################################################

to_do() {
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


# ***Give up on Podman on PopOS/Ubuntu (neither is officially supported w/podman)
# This did not work. Details below.
setup_nvidia_for_podman() {
    # https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#step-1-install-nvidia-container-toolkit
    sudo apt-get update \
        && sudo apt-get install -y nvidia-container-toolkit-base

    nvidia-ctk --version

    if [ ! -e /etc/cdi/nvidia.yaml ]; then
        sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
    fi
    grep "  name:" /etc/cdi/nvidia.yaml


    # https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#id9

    # Specify Ubuntu (even though this is popos)
    curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add - \
        && curl -s -L https://nvidia.github.io/libnvidia-container/ubuntu22.04/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

    sudo apt-get update
    sudo apt-get install -y nvidia-container-toolkit
    sudo apt list --installed *nvidia*
    if [ -e /usr/share/containers/oci/hooks.d/oci-nvidia-hook.json ]; then
        echo "This should not exist, per https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#step-3-using-the-cdi-specification"
        exit 1
    fi

    # Run containers as non-root. Do NOT use this for containers running as root (as they will fail)
    #F=/etc/cdi/nvidia.yaml # Docs
    #
    # Found this file
    # rm /tmp/x; for i in $(sudo apt list --installed 2>/dev/null| grep nvidia | grep jammy | cut -d'/' -f 1); do echo $i; dpkg -L $i |tee -a /tmp/x; done && emacs /tmp/x
    F=/etc/nvidia-container-runtime/config.toml
    sudo sed -i 's/^#no-cgroups = false/no-cgroups = true/;' $F


    # Test
    F1=/tmp/nvidia-smi.host
    F2=/tmp/nvidia-smi.container
    nvidia-smi | tee $F1
    #
    cat <<EOF
    NEXT CMD FAILS. The device is not recognized
    podman run --rm --device nvidia.com/gpu=all ubuntu nvidia-smi -L | tee $F2
    ***Give up on Podman on PopOS/Ubuntu (neither is officially supported w/podman)


    # REMOVE NCT
    #   sudo apt remove nvidia-container-toolkit nvidia-container-toolkit-base
    #   sudo rm /etc/apt/sources.list.d/nvidia-container-toolkit.list
    #   sudo rm -rf /etc/nvidia-container-runtime
    #   sudo ls -ltr /usr/share/containers
EOF
    podman run --rm --device nvidia.com/gpu=all ubuntu nvidia-smi -L | tee $F2
    #
    diff $F1 $F2 # Fail/exit on difference

    # Specify/request for a specific GPU
    # podman run --rm --device nvidia.com/gpu=gpu0 --device nvidia.com/gpu=mig1:0 ubuntu nvidia-smi -L

    # Test
    podman run --rm --security-opt=label=disable \
     --hooks-dir=/usr/share/containers/oci/hooks.d/ \
     --cap-add SYS_ADMIN nvidia/samples:dcgmproftester-2.0.10-cuda11.0-ubuntu18.04 \
     --no-dcgm-validation -t 1004 -d 30
}

setup_podman() {
    if ! which podman; then
        echo "Podman is not installed. Removing any old docker implementations first"
        purge_all_docker

	echo "installing podman"
	echo "Per https://podman.io/docs/installation#debian"
	sudo apt-get install -y podman

    fi

    # https://www.redhat.com/sysadmin/podman-docker-compose
    #   Emulate docker with podman
    sudo apt-get install -y podman-docker

    #   For Docker-Compose
    sudo apt-get install -y docker-compose


    echo "test"
    podman run -it docker.io/library/busybox hostname
    docker run -it docker.io/library/busybox hostname
    docker --version
    docker-compose --version
}

# This uses a VM. Not ideal on Linux when we need to access/debug connection to GPU
podman_desktop() {
    if ! flatpak info io.podman_desktop.PodmanDesktop &>/dev/null; then
	echo "Install podman desktop"
	echo "Per https://podman-desktop.io/docs/Installation/linux-install"

        cat <<EOF
	flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
	flatpak install --user flathub io.podman_desktop.PodmanDesktop

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

# This uses a VM. Not ideal on Linux when we need to access/debug connection to GPU
rancher_desktop() {
    if ! which docker | grep '.rd/bin/docker'; then
	    echo "Install Rancher Desktop"
	    echo "Per https://docs.rancherdesktop.io/getting-started/installation/#linux"
            echo "stop here"
            exit 1
    fi
}

################################################################################
# END: NOT-USED
################################################################################

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

    # From docker-ce: Uninstall docker
    for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get -y remove $pkg || true; done

    # added this
    sudo apt remove -y docker* rancher* podman*

    # Uninstall (rancher etc) never cleans this
    rm -rf ~/.docker

    echo "Review packages"
    sudo apt list --installed | egrep -i 'docker|podman|rancher'
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

    sudo docker run hello-world

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
    docker run --gpus all --ipc=host --ulimit memlock=-1 --ulimit stack=67108864 -it --rm nvcr.io/nvidia/pytorch:23.08-py3
}

main() {
    install_packages

    setup_symlinks

    install_some_docker

    setup_nvidia_for_docker_ce

    #to_do
}

main
#setup_nvidia_for_docker_ce
