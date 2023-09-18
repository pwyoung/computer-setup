#!/bin/bash

LOG=/tmp/python.sh.out

# Conda
F=/opt/conda/etc/profile.d/conda.sh
if [ -e $F ]; then
    echo "Setup Conda" | tee $LOG
    . $F
else
    echo "No Conda" | tee $LOG
fi


# Pyenv
DOTPYENV="$HOME/.pyenv"
if [ -e "$DOTPYENV" ]; then
    echo "Setup pyenv" | tee $LOG
    export PATH="$DOTPYENV/bin:$PATH"
    eval "$(pyenv init --path)"
    eval "$(pyenv virtualenv-init -)"
fi

