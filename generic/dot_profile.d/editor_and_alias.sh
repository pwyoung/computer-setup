#!/bin/bash

# Install emacs server
#   for op in start enable status; do systemctl --user $op emacs; done
if command -v emacsclient >/dev/null && systemctl --user status emacs >/dev/null; then
    export EDITOR='emacsclient'
else
    export EDITOR='emacs'
fi

alias e=$EDITOR
