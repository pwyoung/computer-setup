#!/bin/bash

docs() {

cat <<EOF
################################################################################
# VSCODE
################################################################################

# Tips
open https://linuxhint.com/install-visual-studio-code-pop-os/

# PopOS version - does not (currently) work. Maybe due to installation/removal of flatpak version
#
# Update and cleanup apt packages
sudo apt update && sudo apt upgrade -y && sudo apt autoremove
#
sudo apt install code -y
# USE THE APPLICATION GUI TO INSTALL (which only works after the apt pkg is installed)
sudo dpkg -S /usr/share/code/code
# To remove: sudo apt remove code -y

# VS-CODE in a (flatpak) sandbox:
flatpak install flathub com.visualstudio.code
flatpak run com.visualstudio.code
# remove
flatpak list | grep code

# MS repo
# Steps: https://code.visualstudio.com/docs/setup/linux


################################################################################
EOF
}

function install-it() {

    sudo apt-get install wget gpg
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
    sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
    sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
    rm -f packages.microsoft.gpg
    sudo apt install apt-transport-https
    sudo apt update
    sudo apt install code
}

install-it

