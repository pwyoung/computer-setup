#!/bin/bash

# GOAL: Set up a Windows Machine with an Nvidia GPU for development

set -e

# Path to where we installed https://github.com/pwyoung/computer-setup
# If this exists, this program will create some convenient symlinks
COMPUTER_SETUP=~/git/computer-setup

# Things to symlink (from $COMPUTER_SETUP)
SYMLINKS=".bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"

# Convenient packages to have
PKGS="emacs-nox tree glances htop dmidecode"
# KVM/QEMU with a two options for GUIs
# PKGS+=" gnome-boxes virt-manager"
# For NOMAJ
#PKGS+=" python3-pip vagrant "
# For WSL2
PKGS+=" xdg-utils"
# For XFS
PKGS+=" xfsprogs"
# Python Dev
PKGS+=" python-is-python3 python3-venv python3-pip"
# Docker-Dev-Tooling
PKGS+=" jq"

# For local certs, esp on K8S
# https://github.com/cloudflare/cfssl
PKGS+="  golang-cfssl"

################################################################################

check_prerequisites() {
    # Confirm WSL2
    if ! uname -a | grep "WSL2"; then
	echo "Not on WSL2"
	exit 1
    fi

    # Confirm setup
    if ! ls -l $COMPUTER_SETUP; then
	echo "Missing dir COMPUTER_SETUP"
	exit 1
    fi
}

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

    # VSCODE
    if ! command -v code; then
        echo "Get VSCODE from https://code.visualstudio.com/Download"
        echo "Check extensions here: https://marketplace.visualstudio.com/vscode"
        google-chrome https://code.visualstudio.com/Download#
        exit 1
    fi

}

################################################################################
# DOCKER
################################################################################

# SNAFU: Podman is superior, but, we can't use it on Ubuntu with any expectation it will continue to work.
#   Call this before installing docker to remove podman
#
# Podman is not really meant to run on Ubuntu/PopOS -> due to RedHat/Canonical community mutual snubbing.
#   https://github.com/containers/podman/issues/11665
#
# In a nutshell:
#   - podman devs have no interest in doing work to support Ubuntu
#     Proof: RH report but do not implement the manual solution that could make podman work on Ubuntu.
#            Unsupported docs are unlikekly to work as time goes on. Everyone knows they won't be used much
#            and serious work would be foolish to rely on such a precarious situation.
#   - Ubuntu doesn't care to support podman (since it has no gvproxy package)
#
# *** Give up on Podman on PopOS/Ubuntu (neither is supported by NVIDIA as explicitly/easily as Docker)
#   Of course, it's possible to make it work, but the installation steps are basically left as an exercise for the reader per
#     https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-podmanhttps://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-podman
#     https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-runtimes
remove_podman() {
    if command -v podman; then
        echo "Podman is installed. Removing any old docker implementations first"
        read -p "Press enter to NUKE/PURGE ALL DOCKER IMPLEMENTATIONS!"
        ~/bin/purge-docker.sh
    fi
}

docker_ce() {
    if ! groups | grep docker; then
        echo "Adding $USER to docker group"
        sudo usermod -aG docker $USER
        echo "Exiting: Log in again"
        exit 1
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

}


install_docker_ce() {
    remove_podman

    # Does not (explicitly) support CDI
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#container-device-interface-cdi-support
    # But this seems to be supported in general
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#setting-up-docker
    docker_ce

    # Test it
    # sudo docker run hello-world
    docker run hello-world
}

# Validate Docker
# Ugh... commented this out since....Nvidia says to use Docker-CE on WSL...
#   Per: https://docs.nvidia.com/cuda/wsl-user-guide/index.html
### check_docker_desktop_on_windows() {
###     if ! docker ps; then
###         echo "Docker was not found. Install Docker Desktop"
###         exit 1
###     fi
###
###     if ! ls -l `which docker` | grep -i wsl; then
###         echo "Docker does not appear to be the WSL-integrated version!"
###         exit 1
###     fi
### }

################################################################################
# CONFIGURE DOCKER FOR NVIDIA GPU
################################################################################

# Install NVIDIA CUDA Toolkit
#   https://docs.nvidia.com/cuda/wsl-user-guide/index.html
install_nvidia_cuda_toolkit() {
    # Conveniences
    sudo apt-get update
    sudo apt-get install -y wget
    #sudo apt-get install -y emacs-nox htop wget curl make


    # https://docs.docker.com/desktop/wsl/use-wsl/
    #
    # https://developer.nvidia.com/cuda/wsl
    #
    # https://docs.nvidia.com/cuda/wsl-user-guide/index.html
    #
    # https://developer.nvidia.com/cuda-downloads?target_os=Linux&target_arch=x86_64&Distribution=WSL-Ubuntu&target_version=2.0&target_type=deb_local
    #
    mkdir -p ~/NVIDIA
    cd ~/NVIDIA

    # Install "cuda toolkit"
    #   https://github.com/NVIDIA/nvidia-container-toolkithttps://github.com/NVIDIA/nvidia-container-toolkit
    if ! sudo apt list --installed | grep cuda-toolkit-12-3; then
        F=/etc/apt/preferences.d/cuda-repository-pin-600/cuda-wsl-ubuntu.pin
        if [ ! -e $F ]; then
            wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-wsl-ubuntu.pin
            sudo mv cuda-wsl-ubuntu.pin /etc/apt/preferences.d/cuda-repository-pin-600
        fi

        if [ ! -e cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb ]; then
            wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
        fi
        sudo dpkg -i cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
        sudo cp -f /var/cuda-repo-wsl-ubuntu-12-3-local/cuda-*-keyring.gpg /usr/share/keyrings/
        sudo apt-get update
        sudo apt-get -y install cuda-toolkit-12-3
    fi
}


configure_nvidia_cuda_toolkit_for_docker_ce() {
    # https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#step-1-install-nvidia-container-toolkit

    echo "Installation-step 1"
    F=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    if [ ! -e $F ]; then
        curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o $F
    fi

    F=/etc/apt/sources.list.d/nvidia-container-toolkit.list
    if [ ! -e $F ]; then
        curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee $F
    fi
    sudo apt-get update

    echo "Installation-step 2"
    sudo apt-get install -y nvidia-container-toolkit
    nvidia-ctk --version

    echo "Configuration: Docker"
    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-docker
    # configure docker daemon to recognize Nvidia runtime
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    # Check this
    docker info | grep -i runtimes | grep -i nvidia
}

test_nvidia_docker_support() {
    echo "Test NVIDIA Docker support via nvidia-smi"
    F1=/tmp/nvidia-smi.host
    F2=/tmp/nvidia-smi.container
    echo "The host sees: $F1"
    nvidia-smi | tee $F1
    sudo docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi | tee $F2
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda nvidia-smi # fails, no latest version
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi # Works
    echo "Show nvidia-smi differences between host and container"
    diff $F1 $F2 || true

    echo "Test NVIDIA Docker support via Pytorch"
    # https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch
    # https://docs.nvidia.com/deeplearning/frameworks/support-matrix/index.html
    # docker run --gpus all -it --rm nvcr.io/nvidia/pytorch:23.08-py3 # Memory too low error
    #
    # stack=67108864=64MB
    docker run --gpus all --ipc=host --ulimit memlock=-1 --ulimit stack=67108864 -it --rm nvcr.io/nvidia/pytorch:23.08-py3 hostname

}


enable_nvidia_gpu_with_docker_ce() {
    install_nvidia_cuda_toolkit
    configure_nvidia_cuda_toolkit_for_docker_ce
    test_nvidia_docker_support
}

################################################################################

main() {
    check_prerequisites

    install_packages

    setup_symlinks

    setup_ansible

    misc

    install_nvidia_cuda_toolkit
    configure_nvidia_cuda_toolkit_for_docker_ce
    test_nvidia_docker_support
}

#main
install_nvidia_cuda_toolkit
configure_nvidia_cuda_toolkit_for_docker_ce
test_nvidia_docker_support

