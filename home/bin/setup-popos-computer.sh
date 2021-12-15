#!/bin/bash
# GOAL: Set up a new PopOS machine

set -e

PKGS="emacs-nox htop tree"

# Note: On Fedora, use podman
install_docker() {
    # Docs: https://docs.docker.com/engine/install/ubuntu/
    if docker --version >/dev/null; then
        echo "Docker is already installed"
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
        echo "Looks like Docker rootless context is set up. Testing it now."
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

install_flatpaks() {
    cat <<EOF
# TODO...
# flatpak list --columns=name | sort
Codecs
default
ffmpeg-full
Freedesktop Platform
GNOME Application Platform version 41
GNOME Boxes
GNOME Boxes Osinfo DB
i386
Mesa
nvidia-470-82-00
openh264
Pop Gtk theme
Signal Desktop
Steam
Telegram Desktop
ungoogled-chromium
WebKitGTK
Zoom
EOF

}

install_packages() {
    # KVM/QEMU GUI. Set up
    PKGS+=" gnome-boxes virt-manager"

    # For NOMAJ
    PKGS+=" python3-pip vagrant"

    sudo apt install -y $PKGS

    # https://docs.flatpak.org/en/latest/using-flatpak.html
    # flatpak list
    if cat /etc/qemu/bridge.conf | grep 'virbr0'; then
        echo "It looks like you set up KVM/QEMU user session support already."
    else
        cat <<EOF
TODO:
  - Allow non-root user to use the QEMU/Session resources
    - sudo mkdir -p /etc/qemu
    - echo 'allow virbr0' | sudo tee /etc/qemu/bridge.conf
    - sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
  - Add user (i.e. non-rot) Connection
    - libvirt GUI -> File -> Add Connection -> Hypervisor -> KVM/QEMU user session
EOF
    fi
}


REPORT="N"
report() {
    if [ "$REPORT" = "Y" ]; then
        echo "$1"
    else
        return
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

    F=".atom .bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"
    cd ~/
    for i in $F; do
	make_link ~/git/computer-setup/home/$i ~/$i
    done

}

setup_perms() {
    chmod +x ~/bin/*
    chmod +x ~/.profile.d/*
}

check_sudo_timeout() {
    if sudo cat /etc/sudoers | grep timestamp_timeout >/dev/null; then
        echo "It looks like you already set the sudo timeout period."
    else
        echo "Consider extending sudo timeout"
        echo "e.g. with"
        echo "Defaults        env_reset, timestamp_timeout=9999"
    fi
}

check_sudo_timeout
install_docker
install_packages
#install_flatpaks
setup_symlinks
setup_perms

