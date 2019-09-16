#!/bin/sh
# GOAL: This installs Apple's XCODE dev toolkip

install_xcode() {
    echo "Click 'done' when the GUI installer is done"
    xcode-select --install

    # This can take a product arg (-i)
    #time softwareupdate --install --all 
}

test_xcode() {
    xcode-select --version
}

################################################################################
# MAIN LOGIC
################################################################################

install_xcode
test_xcode

