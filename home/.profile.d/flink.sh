#!/bin/bash

FLINK_HOME="${HOME}/Flink/flink-1.14.3"
if [ -e $FLINK_HOME ]; then
    export FLINK_HOME
    export PATH=$PATH:$FLINK_HOME/bin
fi
