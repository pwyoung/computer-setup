#!/bin/bash

# Common setup
if [ -e ~/.profile.d ]; then
    SCRIPTS=$(ls -1 ~/.profile.d/*.sh 2>/dev/null)
fi
for i in $SCRIPTS; do
    #echo "Running $i"
    source $i &>/dev/null
done

# Private/Sensitive and custom config
if [ -e ~/.private.d ]; then
    PWSCRIPTS=$(ls -1 ~/.private.d/*.sh 2>/dev/null)
fi
for i in $PWSCRIPTS; do
    source $i &>/dev/null
done

if [ -e ~/bin ]; then
    PATH=~/bin:$PATH
fi

# Moved to ~/.profile.d/z
#alias z='cd $(cat ~/.marked_path)'

export PS1='\h:\W \u\$ '

export PATH
