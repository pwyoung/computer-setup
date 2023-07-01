#!/bin/bash

RANCHER_HOME="${HOME}/.rd"
if [ -e $RANCHER_HOME ]; then
    export PATH=$RANCHER_HOME/bin:$PATH
fi
