#!/bin/bash

D=~/BALENA/balena-cli

if [ -e $D ]; then
    PATH=$PATH:$D
    export $PATH
fi
