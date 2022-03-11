#!/bin/bash
# GOAL: Set up a new PopOS machine with at least the requirements needed for nomaj

set -e

# Path to where we installed https://github.com/pwyoung/computer-setup
# If this exists, this program will create some convenient symlinks
COMPUTER_SETUP=~/git/computer-setup

# Things to symlink (from $COMPUTER_SETUP)
SYMLINKS=".bash_profile bin .dircolors .emacs .gitconfig .gitignore .profile.d .tmux .tmux.conf"
# .zprofile is symlinked to .bash_profile in this git repo
SYMLINKS+=" .zprofile"

# Verbose reporting
VERBOSE="Y"

report() {
    if [ "$VERBOSE" == "Y" ]; then
        echo "$1"
    else
        return
    fi
}

confirm_mac() {
    if ! uname | grep Darwin 2>/dev/null; then
	echo "This is not a Mac"
	exit 1
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

install_packages() {
    echo "update Brew"
    brew update
    brew tap homebrew/cask-versions
    brew --version

    # Install virtualbox and vagrant
    
}

confirm_mac
setup_symlinks
setup_perms
install_packages
