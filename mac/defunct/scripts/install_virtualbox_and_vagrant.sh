#!/bin/sh

# GOAL: Install vagrant via homebrew

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

install_virtualbox() {
    # SNAFU: Sierra kernel extension protections hose virtualbox
    # https://github.com/docksal/docksal/issues/417
    # Let this fail
    brew_cask_install "virtualbox"
    open https://github.com/docksal/docksal/issues/417
    read -p "Allow Oracle access to install kernel extensions per the spawned web page and hit continue"
    # Then open the security prefs and all
    brew_cask_install "virtualbox"
    brew_cask_install "virtualbox-extension-pack"

    ver=$(VBoxManage -version)
    URL='https://www.virtualbox.org/wiki/Downloads'
    latest=$(curl -s $URL | grep OSX | perl -pe 's/.*virtualbox\/(.*?)\/VirtualBox.*/$1/')
    echo "Virtualbox is installed. Version=$ver. Latest-Version=$latest"
}

install_vagrant() {
    brew_cask_install "vagrant"

    # Reinstall plugins (to make sure the dependencies match)
    vagrant plugin expunge --reinstall -f
}

install_vagrant_manager() {
    # Kill any running version of "Vagrant Manager"
    killall Vagrant\ Manager

    brew_cask_install "vagrant-manager"

    # Kill any running version of "Vagrant Manager"
    killall Vagrant\ Manager

    # Start it
    /Applications/Vagrant\ Manager.app/Contents/MacOS/Vagrant\ Manager > /tmp/Vagrant_Manager.out 2>&1 &
}

test_virtualbox(){
    echo "Test Virtualbox"
    TEST_DIR=~/test_virtualbox
    mkdir -p $TEST_DIR
    cd $TEST_DIR

    #vagrant box add precise64 http://files.vagrantup.com/precise64.box
    #vagrant init precise64
    #
    #vagrant init centos/7
    #
    vagrant init minimal/centos7

    vagrant up
    vagrant status

    vagrant ssh default --command "hostname"
    vagrant halt --force
    vagrant destroy --force
}


brew_update
install_virtualbox
test_virtualbox
install_vagrant
install_vagrant_manager
