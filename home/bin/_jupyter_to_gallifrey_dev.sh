#!/bin/bash

host_port="8888"
container_port="8888"
SSH_ALIAS="gallifrey-dev"
ssh -f -N -L $host_port:localhost:$container_port $SSH_ALIAS

BROWSER='open'
if command -v google-chrome; then
    BROWSER='google-chrome'
fi

$BROWSER http://127.0.0.1:8888
