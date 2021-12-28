#!/bin/bash
# GOAL: Set up a new PopOS machine with at least the requirements needed for nomaj

set -e

# Path to where we installed https://github.com/pwyoung/computer-setup
# If this exists, this program will create some convenient symlinks
COMPUTER_SETUP=~/git/computer-setup

# Things to symlink (from $COMPUTER_SETUP)
SYMLINKS=".atom .bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"

# Convenient packages to have
PKGS="emacs-nox tree glances htop"
# KVM/QEMU with a two options for GUIs
PKGS+=" gnome-boxes virt-manager"
# For NOMAJ
PKGS+=" python3-pip vagrant "

# Verbose reporting
VERBOSE="Y"

report() {
    if [ "$VERBOSE" == "Y" ]; then
        echo "$1"
    else
        return
    fi
}

# Note: On Fedora, use podman
install_docker() {
    # Docs: https://docs.docker.com/engine/install/ubuntu/
    if docker --version >/dev/null; then
        report "Docker is already installed"
    else
        sudo apt-get update

        sudo apt-get install \
             ca-certificates \
             curl \
             gnupg \
             lsb-release

        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update

        sudo apt-get install docker-ce docker-ce-cli containerd.io
    fi

    # Test
    if docker context ls | grep 'rootless *'; then
        report "Looks like Docker rootless context is set up."
        docker context ls
        report "Running a test now"
        docker run hello-world
    else
        sudo docker run hello-world

        # Docs: https://docs.docker.com/engine/install/linux-postinstall/
        cat <<EOF
  Allow non-root user to use the DOCKER (to reduce security vulnerabilities)
    - Docs
      - https://docs.docker.com/engine/security/rootless/
    - Steps
      - systemctl stop docker
      - dockerd-rootless-setuptool.sh install
      - systemctl --user start docker
      - docker context use rootless
    - Tests
      - echo "TEST-1" && docker run -d -p 8080:80 nginx
      - echo "TEST-2" && docker ps && docker run hello-world
      - echo "Show the contexts and which is in use" && docker context ls
NAME         DESCRIPTION                               DOCKER ENDPOINT                     KUBERNETES ENDPOINT   ORCHESTRATOR
default      Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                               swarm
rootless *   Rootless mode                             unix:///run/user/1002/docker.sock
EOF
        fi
}

install_packages() {
    sudo apt install -y $PKGS
}

setup_python_link() {
    # For Ansible (and other things) that expect to find "python" in the path
    if ! test -f /usr/bin/python && test -f /usr/bin/python3; then
        report "Creating symbolic link from /usr/bin/python to /usr/bin/python3"
        sudo ln -s /usr/bin/python3 /usr/bin/python
    fi
}

setup_nonroot_qemu_session() {
    if cat /etc/qemu/bridge.conf | grep 'virbr0'; then
        report "It looks like you set up KVM/QEMU user session support already."
    else
        report "Allow non-root user to use the QEMU/Session resources"
        sudo mkdir -p /etc/qemu
        echo 'allow virbr0' | sudo tee /etc/qemu/bridge.conf
        sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
        cat <<EOF
- TODO:
  - Add user (i.e. non-rot) Connection
    - libvirt GUI -> File -> Add Connection -> Hypervisor -> KVM/QEMU user session
    - Test this easily using something like gnome-boxes to make a new VM
EOF
        sleep 9
    fi
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
    fi

}

setup_perms() {
    report "Setting exec perms on our directories"
    chmod +x ~/bin/*
    chmod +x ~/.profile.d/*
}

check_sudo_timeout() {
    if sudo cat /etc/sudoers | grep timestamp_timeout >/dev/null; then
        report "It looks like you already set the sudo timeout period."
    else
        report "Consider extending sudo timeout by running 'sudo visudo' and editing the env_reset line to contain"
        report "Defaults        env_reset, timestamp_timeout=<MINUTES_TO_TIMEOUT>"
    fi
}

setup_onedrive() {
    echo "Setup OneDrive"
    mkdir -p ~/OneDrive
    /home/pwyoung/bin/pwyoung-one-drive.bash -i
}


setup_symlinks
install_packages
check_sudo_timeout
install_docker
setup_perms
#install_flatpaks
setup_nonroot_qemu_session
setup_python_link
setup_onedrive
