#!/bin/bash

set -e

# K3S uses Containerd (by default)
#   https://docs.k3s.io/advanced#using-docker-as-the-container-runtime
# See if it can see the Nvidia GPU
#   If this fails, try using Docker as the runtime

test_containerd() {
    sudo ctr tasks list
    #
    sudo ctr image pull docker.io/library/hello-world:latest
    sudo ctr run --rm docker.io/library/hello-world:latest ctr-test-hello-world
    #
    sudo ctr images list
}

test_nvidia_deps() {
    echo "Check Nvidia deps"
    # NVIDIA drivers
    nvidia-smi

    # Show packages
    sudo apt list --installed | egrep 'libnvidia-container1|libnvidia-container-tools|nvidia-container-toolkit|nvidia-container-toolkit-base'
    # List package versions, e.g.
    #   apt list -a nvidia-container-toolkit-base
    # Install a version, e.g.
    #   sudo apt install nvidia-container-toolkit-base=1.12.1-0pop1~1679409890~22.04~5f4b1f2

    # NVIDIA container runtime
    nvidia-container-runtime --version
    # ls -l /usr/bin/nvidia-container-runtime
    # sudo dpkg -S /usr/bin/nvidia-container-runtime
    #   nvidia-container-toolkit-base: /usr/bin/nvidia-container-runtime
}

configure_containerd_for_nvidia() {
    echo "Test containerd is in use (installed and running)"
    sudo systemctl status containerd

    #   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-containerd
    sudo nvidia-ctk runtime configure --runtime=containerd
    cat /etc/containerd/config.toml
    sudo systemctl restart containerd
}

# https://github.com/k3s-io/k3s/issues/8248
#sudo ctr image pull docker.io/nvidia/cuda:12.1.1-base-ubuntu22.04
#sudo ctr run --rm -t     --runc-binary=/usr/bin/nvidia-container-runtime     --env NVIDIA_VISIBLE_DEVICES=all     docker.io/nvidia/cuda:11.6.2-base-ubuntu20.04     cuda-11.6.2-base-ubuntu20.04 nvidia-smi
