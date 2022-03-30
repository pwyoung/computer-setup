#!/bin/bash

F=~/.custom-mouse-scaling.txt

# If this is a mac, and $F does not exist, then set the mouse sensitivity
if uname | grep Darwin >/dev/null; then
    if [ ! -f $F ]; then
        defaults write -g com.apple.mouse.scaling 8
        defaults read -g com.apple.mouse.scaling > $F
    fi

    # "open" does not work on html files properly
    alias browse='open -a "/Applications/Google Chrome.app"'
    alias o='open -a "/Applications/Google Chrome.app"'

fi
