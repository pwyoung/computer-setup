#!/bin/bash

#L=~/mac-setup.log
#echo "Running $0" | tee $L

F=~/.custom-mouse-scaling.txt

# This is needed for slow mice since the GUI won't let me speed
# the mouse up beyond "3"
SCALE_FACTOR="9.0"

function setup_mouse_scaling_speed() {
    # Set the mouse scaling. This can exceed the values the GUI supports.
    defaults write .GlobalPreferences com.apple.mouse.scaling -1
    defaults write -g com.apple.mouse.scaling $SCALE_FACTOR
    # Store the values
    defaults read -g com.apple.mouse.scaling >> $F
}

function setup_homebrew() {
    # Do this after installing it
    D=/opt/homebrew/bin
    if [ -e $D ]; then
        PATH=$D:$PATH
    fi
}

if uname | grep Darwin >/dev/null; then

    echo "$(date)" > $F

    setup_mouse_scaling_speed

    # "open" does not work on html files properly
    alias o='open -a "/Applications/Google Chrome.app"'

    setup_homebrew

    # https://github.com/microsoft/Git-Credential-Manager-for-Mac-and-Linux/blob/master/Install.md
    #setup_git_credential_manager
    #
    # Test
    #   $(git config --global --get credential.helper git-credential-manager) --version

    # snafu...
    alias scp='noglob scp'

    # Stop opening a window...
    P=/opt/homebrew/bin/emacs
    if [ -e $P ]; then
        alias emacs="$P -nw"
    fi


fi
