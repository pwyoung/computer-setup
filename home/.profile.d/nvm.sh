#!/bin/bash

echo "Checking for NVM" > /tmp/x

if [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
    echo "MAC: Adding NVM" >> /tmp/x
    # MAC: brew uses this
    mkdir -f ~/.nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
    [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
else
    # NVM: linux
    if [ -e "$HOME/.nvm" ]; then
        echo "Linux: Adding NVM" >> /tmp/x
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
        [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    fi
fi
