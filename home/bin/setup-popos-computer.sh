#!/bin/bash
# GOAL: Set up a new PopOS machine

set -e

PKGS="emacs-nox htop tree"

# On Fedora, use podman
install_docker() {
    # Docs: https://docs.docker.com/engine/install/ubuntu/
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

    sudo docker run hello-world

    # Docs: https://docs.docker.com/engine/install/linux-postinstall/
    cat <<EOF
  Allow non-root user to use the DOCKER resources (which has security implications)
    - sudo systemctl enable --now docker
    - sudo usermod -aG docker $USER
    - reboot # reset group membership everywhere
    - echo "TEST"; docker ps && docker run hello-world
EOF
    
}

install_flatpaks() {
    # flatpak list | perl -pe 's/^(.*?)\t.*/$1/' | sort
    # flatpak list --columns=name | sort
    cat <<EOF 
# TODO...
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
    
    # Docker
    # https://docs.docker.com/engine/install/ubuntu/
    #PKGS+=" docker.io"    
    
    sudo apt install -y $PKGS

    # https://docs.flatpak.org/en/latest/using-flatpak.html
    # flatpak list

    cat <<EOF
TODO:
  - Allow non-root user to use the QEMU/Session resources
    - echo 'allow virbr0' | sudo tee /etc/qemu/bridge.conf
    - sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
EOF
}


make_link() {
    TGT=$1    
    SRC=$2
    echo "INFO: Considering link to $TGT from $SRC"
    if [ -s $SRC ]; then
	echo "WARNING: Source $SRC already exists. Skipping"
	return
    fi
    if [ ! -e $TGT ]; then
	echo "ERROR: Target $TGT does not exist."
	exit
    fi
    echo "INFO: Making link to $TGT from $SRC"
    ln -s $TGT $SRC
}

archived_check_data_drive() {
    # Just use /home as the "data" drive from now on.
    echo "This assume that the data drive is already set up on /data"
    echo "Hit enter if this is true, control-c or enter any string otherwise"
    read OK
    if [ ! "$OK" == "" ]; then
	echo "Aborting."
	exit 1
    fi
    make_link /data ~/data
    make_link /data/git ~/git     
}

setup_symlinks() {

    F=".atom .bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .ssh .tmux .tmux.conf"
    cd ~/
    for i in $F; do
	make_link ~/git/computer-setup/home/$i ~/$i 
    done

}

#install_docker
#install_packages
#install_flatpaks
setup_symlinks
