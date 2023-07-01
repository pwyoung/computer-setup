#!/bin/bash

################################################################################
# KAFKA
################################################################################
if [ -d /kafka ]; then
    export KAFKA_HOME=/kafka
fi
if [ ! -z "$KAFKA_HOME" ]; then
    echo "KAFKA_HOME is $KAFKA_HOME"
    PATH=$KAFKA_HOME/bin:$PATH
fi
