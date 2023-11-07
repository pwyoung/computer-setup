#!/bin/bash

# See https://github.com/pwyoung/docker-dev-tooling

L=/tmp/docker-dev-tools.sh.out

H=$(hostname)

# If the hostname is 'dev' then assume we are in a dev container
if [[ "$H" == "dev" ]]; then
    echo "In dev container" > $L
else
    echo "NOT in dev container" > $L
    D=~/git/docker-dev-tooling/bin
    if [ -e $D ]; then
        echo "Adding $D to PATH" >> $L
        PATH=$D:$PATH
    fi

    D2=~/git/docker-dev-tooling/bin/subcommands
    if [ -e $D2 ]; then
        echo "Adding $D2 to PATH" >> $L
        PATH=$D2:$PATH
    fi

    export $PATH
fi
