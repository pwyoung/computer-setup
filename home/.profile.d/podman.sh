#!/bin/bash

# Do not run podman on mac
if ! uname | grep Darwin >/dev/null; then

    if command -v podman >/dev/null; then
        alias docker='podman'
    fi

    if command -v podman-compose >/dev/null; then
        alias docker-compose='podman-compose'
    fi
fi

