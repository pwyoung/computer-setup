#!/bin/bash

D=~/git/docker-dev-tooling/bin
if [ -e $D ]; then
    PATH=$D:$PATH
    export $PATH
fi
