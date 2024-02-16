#!/bin/bash

LOG=/tmp/nvm.out

if [ "$SKIP" != "false" ]; then
    echo "Skip. this is slow. Skipping it" > $LOG
else
    echo "Checking for NVM" > $LOG
    if [ -e "/usr/local/opt/nvm/nvm.sh" ]; then
        echo "MAC: Adding NVM" >> $LOG
        # MAC: brew uses this
        mkdir -p ~/.nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm AND TAKES A LONG TIME
        [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
    else
        # NVM: linux
        if [ -e "$HOME/.nvm" ]; then
            echo "Linux: Adding NVM" >> $LOG
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
            [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
        fi
    fi
fi

