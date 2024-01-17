#!/bin/bash

# This was used to set up a dev VM in KVM (on ProxMox)
#
# This is a modified version of
#   https://github.com/pwyoung/docker-dev-tooling/blob/main/Dockerfile

if [ "$(id -u)" == "0" ]; then
    echo "ok, you're running this as root"
else
    echo "Run this as root"
    exit 1
fi

################################################################################
# OS Packages
################################################################################

# Install packages
# Split up due to timeout issues building this via WSL2
apt-get update

# Important
apt-get install -y wget curl unzip sudo jq git groff
apt-get install -y software-properties-common
apt-get install -y graphviz
apt-get install -y openssh-server

# Convenient
apt-get install -y pass less tree emacs-nox iputils-ping dnsutils whois htop psmisc bash-completion time net-tools

################################################################################
# SSH server
################################################################################

mkdir -p /run/sshd

################################################################################
# User CLI conveniences
################################################################################

#   These would normally be aliases
echo 'git log --oneline --graph' > /usr/local/bin/gl && \
  echo 'git status $@' > /usr/local/bin/gs && \
  echo 'git branch' > /usr/local/bin/gb && \
  echo 'emacs -nw $@' > /usr/local/bin/e && \
  echo 'rm -rf ./*~ ./*# 2>/dev/null' > /usr/local/bin/c && \
  echo 'ls --color=auto -ltr $@' > /usr/local/bin/l && \
  echo 'echo "$PWD" > ~/.marked_path' > /usr/local/bin/m && \
  echo 'pstree -GapT' > /usr/local/bin/pt && \
  chmod 0755 /usr/local/bin/{gl,gs,gb,e,c,l,m,pt}

################################################################################
# PYTHON
################################################################################

ARG PKGS="make python3-pip python3-venv python-is-python3"

apt-get update && apt-get install -y $PKGS

################################################################################
# INFRASTRUCTURE
################################################################################

# Add Terraform
#   https://www.terraform.io/downloads
cd /tmp && \
  curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add - && \
  apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main" && \
  apt-get update && apt-get install terraform

# Add Terragrunt
# https://github.com/gruntwork-io/terragrunt/releases
cd /tmp && \
  wget https://github.com/gruntwork-io/terragrunt/releases/download/v0.53.2/terragrunt_linux_amd64 -O /usr/local/bin/terragrunt && \
  chmod 0755 /usr/local/bin/terragrunt && \
  terragrunt --version

# AWS-Nuke: TODO
#   https://github.com/rebuy-de/aws-nuke/releases

# MAAS
#apt-add-repository ppa:maas/3.4-next && apt update && apt-get -y install maas

################################################################################
# MICROSOFT: Azure, DotNet
################################################################################

#  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-linux?pivots=apt
apt-get install -y ca-certificates curl apt-transport-https lsb-release gnupg && \
  curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/microsoft.gpg > /dev/null && \
  echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/azure-cli.list && \
  apt-get update -y && apt-get install -y azure-cli && \
  az --version | grep azure-cli

# https://learn.microsoft.com/en-us/dotnet/core/install/linux-ubuntu-2204
apt-get update && \
    apt-get install -y dotnet-sdk-7.0

# Mono: Don't use it.
#   Mono apparently lacks some features of the "real" dotnet version.
#   Mono is not tested on Ubuntu 22.04, only 20.04
#     per ttps://www.mono-project.com/download/stable/#download-lin


################################################################################
# WEBAPP DEV
################################################################################

# MITMPROXY
#   https://docs.mitmproxy.org/stable/
#   https://hub.docker.com/r/mitmproxy/mitmproxy/
mkdir -p /tmp/mitm && \
    cd /tmp/mitm && \
    wget https://downloads.mitmproxy.org/10.0.0/mitmproxy-10.0.0-linux.tar.gz && \
    tar xvzf mitmproxy-*-linux.tar.gz

cd /tmp/mitm && \
    chmod 755 /tmp/mitm/mitm* && \
    chown $DEVUID:$DEVUID /tmp/mitm/mitm* && \
    mv /tmp/mitm/mitm* /usr/local/bin

################################################################################
# Network Speed testing
################################################################################

curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash \
    && sudo apt update \
    && sudo apt-get install speedtest

sudo apt-get install -y lsof

################################################################################
# K8S
################################################################################

# Per https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/#install-using-native-package-management

sudo apt-get update && \
  sudo apt-get install -y apt-transport-https ca-certificates curl && \
  curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg && \
  echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list && \
  sudo apt-get update && \
  sudo apt-get install -y kubectl kubeadm kubecolor kubetail

# Helm
mkdir -p /root/helm && \
  cd /root/helm && \
  wget https://get.helm.sh/helm-v3.13.1-linux-amd64.tar.gz && \
  tar -zxvf helm-v3.13.1-linux-amd64.tar.gz && \
  mv -f /root/helm/linux-amd64/helm /usr/local/bin && \
  chmod 755 /usr/local/bin/helm

################################################################################
# NVIDIA:NEMO
#   https://docs.nvidia.com/deeplearning/frameworks/pytorch-release-notes/rel-23-08.html#rel-23-08
################################################################################

sudo apt-get update && sudo apt-get install -y libsndfile1 ffmpeg

# TODO: move up
python -m pip install --upgrade pip

#
# STOPPED HERE: for now, just base this image on the official Nemo container from NGC
#

################################################################################
# JUPYTER
################################################################################

# Show versions available
# - Latest available now is v4.0.6 per
#   - pip index versions jupyterlab
# - Latest STABLE available now is v4.0.5 per
#   - https://jupyterlab.readthedocs.io/en/stable/user/debugger.html
# - Latest AWS Sagemaker is v3.x, per
#   - https://docs.aws.amazon.com/sagemaker/latest/dg/nbi-jl.html

# Use the nemo:23.06 container includes (v2.x)
# python3 -m pip install jupyterlab==4.0.5

################################################################################
# AWS
################################################################################

# This is defunct now that the aws-cli supports Bedrock
# AWS bin
#COPY ./docker-scripts/aws /usr/local/bin/aws
#chmod 0755 /usr/local/bin/aws

# https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions
mkdir -p ~/AWS && cd ~/AWS && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    sudo ./aws/install

################################################################################
# ANSIBLE
################################################################################

sudo apt-get install -y ansible

################################################################################
# CLEANUP
################################################################################

