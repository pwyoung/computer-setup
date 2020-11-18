#!/bin/bash
# GOAL: Set up a new PopOS machine

set -e

PKGS="emacs-nox htop tree"

install_packages() {
    # KVM/QEMU GUI. Set up 
    PKGS+=" gnome-boxes virt-manager"
    
    # Google-derivative browser
    PKGS+=" chromium"
    
    # NOMAJ
    PKGS+=" python3-pip vagrant"
    
    # Docker
    PKGS+=" docker.io"    
    
    sudo apt install -y $PKGS

    # https://docs.flatpak.org/en/latest/using-flatpak.html
    # flatpak list

    cat <<EOF
TODO:
  - Allow non-root user to use the QEMU/Session resources
    - echo 'allow virbr0' | sudo tee /etc/qemu/bridge.conf
    - sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
  - Allow non-root user to use the DOCKER resources
    - sudo systemctl enable --now docker
    - sudo usermod -aG docker $USER
    - reboot # reset group membership everywhere
    - echo "TEST"; docker ps && docker run hello-world
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

setup_symlinks() {
    echo "This assume that the data drive is already set up on /data"
    echo "Hit enter if this is true, control-c or enter any string otherwise"
    read OK
    if [ ! "$OK" == "" ]; then
	echo "Aborting."
	exit 1
    fi
    make_link /data ~/data
    make_link /data/git ~/git 

    F=".atom .bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .ssh .tmux .tmux.conf"
    cd ~/
    for i in $F; do
	make_link ~/git/computer-setup/home/$i ~/$i 
    done

}

setup_symlinks
