#!/bin/bash

DOTPYENV="$HOME/.pyenv"
if [ -e "$DOTPYENV" ]; then
    export PATH="$DOTPYENV/bin:$PATH"
    eval "$(pyenv init --path)"
    eval "$(pyenv virtualenv-init -)"
fi



