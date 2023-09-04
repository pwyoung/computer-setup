#!/bin/sh

# docker might be available as:
# - community edition of docker
# - podman
# - Rancher's implementation

L=/tmp/setup-podman-docker-rancher-etc.log

setup_podman() {
    if command -v podman >/dev/null; then
	#alias docker='podman'
        echo 'podman $@' > ~/bin-local/docker
    fi

    if command -v podman-compose >/dev/null; then
	#alias docker-compose='podman-compose'
        echo 'podman-compose $@' > ~/bin-local/docker-compose
    fi
}


# Rancher automatically adds ~/.rd to PATH
# So, move it off if we temporarily don't want to use it
avoid_rancher() {
    if [ -e ~/.rd ]; then
        mv ~/.rd ~/.rd.MOVED
    fi
}
restore_rancher() {
    if [ -e ~/.rd.MOVED ]; then
        mv ~/.rd.MOVED ~/.rd
    fi
}
# This is easier than editing ~/.bash_profile and ~/.bashrc (constantly)
# avoid_rancher
# restore_rancher

if [ -e ~/.rd ]; then
    echo "Using Rancher Desktop" > $L
elif command -v podman &>/dev/null; then
    echo "Using Podman" > $L
    setup_podman
fi

which docker &>1 >> $L
docker --version >> $L
which docker-compose &>1 >> $L
docker-compose --version >> $L
