#!/bin/sh

# GOAL: Install the apps here, via homebrew
#
#   This assumes brew_install and brew_cask_install are in PATH, which are just
#   the normal programs that avoid warnings/errors if the component is installed already

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

apps='emacs wget tree pstree git jq watch fswatch'
apps="$apps libtool go bash-completion brew-cask-completion"
# Removed since we probably need to install docker without brew and not let brew install a new one 
# docker-completion"

caskapps='google-chrome atom spotify skype signal slack evernote jetbrains-toolbox eclipse-ide'
caskapps="$caskapps iterm2 firefox-esr signal rocket-chat"
#caskapps="caskapps sequel the-unarchiver datagrip"

update_homebrew(){
    # Verify Homebrew
    brew doctor
    
    # Update
    brew update
}

install_homebrew_apps() {
    for i in $apps; do
	brew_install $i
    done
    
    for i in $caskapps; do
	brew_cask_install $i
    done
    
}

update_homebrew
install_homebrew_apps

