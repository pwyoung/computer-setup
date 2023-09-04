#!/bin/sh

# docker might be available as:
# - community edition of docker
# - podman
# - Rancher's implementation

L=/tmp/setup-podman-docker-rancher-etc.log

setup_podman() {
    if command -v podman >/dev/null; then
	alias docker='podman'
    fi

    if command -v podman-compose >/dev/null; then
	alias docker-compose='podman-compose'
    fi
}

if [ -e ~/.rd/bin/docker ]; then
    echo "Using Rancher Desktop" > $L
elif command -v podman &>/dev/null; then
    echo "Using Podman" > $L
    setup_podman
fi
