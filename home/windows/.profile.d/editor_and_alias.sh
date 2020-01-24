#!/bin/bash

# Install emacs server
#   for op in start enable status; do systemctl --user $op emacs; done


#if command -v flatpak 2>/dev/null; then
#    export EDITOR='emacs'
#    alias e='flatpak run org.gnu.emacs -nw 2>/dev/null'
#el
if command -v emacsclient >/dev/null && systemctl --user status emacs >/dev/null; then
    export EDITOR='emacsclient'
    alias e='emacsclient -nw -a emacs'
else
    export EDITOR='emacs'
    alias e='emacs -nw'
fi


