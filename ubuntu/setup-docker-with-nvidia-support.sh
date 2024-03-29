#!/bin/bash

# GOAL:
#   This installs Docker-CE and sets up Nvidia-GPU support for containers in it.

set -e

# Nvidia Driver version
ND='550'
# Dynamically get the latest driver available
#   sudo apt update
#   ND=$(sudo apt list | egrep 'nvidia-driver-.../' | perl -pe 's/nvidia-driver-(.*?)\/.*/$1/' | sort -u | tail -1)

remember_docker_lessons_learned() {

    # Podman is not really supported on Ubuntu/PopOS due to RedHat/Canonical community mutual snubbing.
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

    # WIP: stopped for now (since Nvidia container toolkit didn't seem to work with it)
    # Trying with Rancher-Desktop (and its embedded k3s)
    #if which docker | grep '/.rd/'; then
    #    echo "Rancher Desktop was found in PATH"
    #else
    #    echo "Rancher Desktop was not found in PATH"
    #    exit 1
    #fi

}

docker_ce() {
    if command -v podman; then
        echo "Podman is installed. Removing any old docker implementations first"
        purge_all_docker
    fi

    if docker --version; then
        echo "Docker is already installed"
        if ! docker run hello-world; then
            echo "If you just installed docker, then reboot"
            echo "to make sure all processes know you're in the docker group"
            sleep 3
            exit 1
        fi
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

    # Test it
    docker run hello-world
}

bail() {
    echo "BAILING"
    exit 1
}

install_nvidia_ctk() {
    # Install container tookit
    if ! nvidia-ctk --version; then
        curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
            && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
                sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
                sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
        sudo apt-get update
        sudo apt-get install -y nvidia-container-toolkit
        nvidia-ctk --version
    fi
}


install_nvidia_driver() {
    echo "Installing nvidia driver"
    sudo apt -y install linux-headers-$(uname -r)
    sudo apt-get install -y nvidia-driver-$ND nvidia-dkms-$ND
    echo "reboot now. Allow/Enroll MOK"
    exit 1
}

check_for_nvidia_driver() {
    if ! nvidia-smi; then
        echo "Install nvidia drivers first. This will use driver version $ND"
        read -p "Hit OK to install nvidia driver"
        install_nvidia_driver
    fi
}

configure_docker_for_ctk() {
    # configure docker daemon to recognize Nvidia runtime
    sudo nvidia-ctk runtime configure --runtime=docker
    CHECK=$(cat /etc/docker/daemon.json | jq -r .runtimes.nvidia.path)
    echo "Checked runtime should include: $CHECK"
    sudo systemctl restart docker
    # Check this
    docker info | grep -i runtimes | grep -i nvidia
}

test_docker_via_ctk() {
    F1=/tmp/nvidia-smi.host
    F2=/tmp/nvidia-smi.container
    nvidia-smi | tee $F1
    sudo docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi | tee $F2
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda nvidia-smi # fails, no latest version
    # docker run --rm --runtime=nvidia --gpus all nvidia/cuda:11.6.2-base-ubuntu20.04 nvidia-smi # Works
    echo "Show nvidia-smi differences between host and container"
    diff $F1 $F2 || true
}

cleanup_docker_ctk_setup() {
    # Cleanup
    # Get rid of deprecation warnings
    # Per https://itsfoss.com/key-is-stored-in-legacy-trusted-gpg/
    if sudo apt update | egrep '^W:' | grep 'Key is stored in legacy trusted.gpg keyring'; then
        #W: https://nvidia.github.io/libnvidia-container/stable/deb/amd64/InRelease: Key is stored in legacy trusted.gpg keyring (/etc/apt/trusted.gpg), see the DEPRECATION section in apt-key(8) for details.
        #W: https://nvidia.github.io/libnvidia-container/stable/ubuntu18.04/amd64/InRelease: Key is stored in legacy trusted.gpg keyring (/etc/apt/trusted.gpg), see the DEPRECATION section in apt-key(8) for details.
        sudo cp /etc/apt/trusted.gpg /etc/apt/trusted.gpg.d
        sudo apt update
    fi
}

# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#step-1-install-nvidia-container-toolkit
setup_nvidia_for_docker_ce() {

    check_for_nvidia_driver
    install_nvidia_ctk
    configure_docker_for_ctk
    test_docker_via_ctk
    #cleanup_docker_ctk_setup

    #if [ ! -e /etc/cdi/nvidia.yaml ]; then
    #    sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
    #fi
    #grep "  name:" /etc/cdi/nvidia.yaml


    #distro=$(. /etc/os-release;echo $ID$VERSION_ID)
    # PopOS is compatible with Ubuntu (packages etc)
    #distro=$(echo $distro | perl -pe 's/pop/ubuntu/')
    #curl -s -L https://nvidia.github.io/libnvidia-container/$distro/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
}

test_gpu() {
    # Docker-CE does not support CDI (K8S does not love Docker-CE in general...)
    #
    # Run containers as non-root. Do NOT use this for containers running as root (as they will fail)
    #F=/etc/cdi/nvidia.yaml # Docs
    #
    # Show files owned by Nvidia packages that are installed on this system
    # rm /tmp/x; for i in $(sudo apt list --installed 2>/dev/null| grep nvidia | grep jammy | cut -d'/' -f 1); do echo $i; dpkg -L $i |tee -a /tmp/x; done && emacs /tmp/x
    #F=/etc/nvidia-container-runtime/config.toml
    #sudo sed -i 's/^#no-cgroups = false/no-cgroups = true/;' $F

    # Test with CUDA
    IMG='nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda10.2'
    docker run --gpus all --ipc=host --ulimit memlock=-1 --ulimit stack=67108864 -it --rm $IMG

    # Test with Pytorch
    # https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch
    # https://docs.nvidia.com/deeplearning/frameworks/support-matrix/index.html
    # docker run --gpus all -it --rm nvcr.io/nvidia/pytorch:23.08-py3 # Memory too low error
    # stack=67108864=64MB
    docker run --gpus all --ipc=host --ulimit memlock=-1 --ulimit stack=67108864 -it --rm nvcr.io/nvidia/pytorch:23.08-py3 hostname
}

main() {
    docker_ce
    setup_nvidia_for_docker_ce
    test_gpu
}

main
