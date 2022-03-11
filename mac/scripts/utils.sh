#!/bin/sh

# Minimize noise related to attempting to install brews that are alresady installed

brew_update () {
    brew update
    brew tap homebrew/cask-versions
}

brew_install() {
    if brew list $1; then
	echo "$1 is installed already"
    else
	brew install $1
    fi
}

brew_cask_install() {
    if brew list --cask $1; then
	echo "$1 is installed already"
    else
	brew install --cask $1
    fi
}
