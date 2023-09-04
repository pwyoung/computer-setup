#!/bin/bash

# See https://github.com/pwyoung/docker-dev-tooling

L=/tmp/docker-dev-tools.sh.out

H=$(hostname)

# If the hostname starts with 'devc-' then assume we are in a dev container
if [[ "$H" == "devc-"* ]]; then
    echo "In dev container" > $L
else
    echo "NOT in dev container" > $L
    D=~/git/docker-dev-tooling/bin
    if [ -e $D ]; then
        echo "Adding ~/git/docker-dev-tooling/bin to PATH" >> $L
        PATH=$D:$PATH
        export $PATH
    fi
fi
