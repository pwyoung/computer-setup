#!/bin/bash


clean_slate() {
    # Remove all containers
    for i in $(docker ps -a --format json | jq -r .ID); do
        docker rm -f $i
    done

    # Remove all images
    for i in $(docker images --format json | jq -r .ID); do
        docker rmi -f $i
    done

}


nuke_docker() {
    # From docker-ce: Uninstall docker
    #for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get -y remove $pkg || true; done
    # added this
    #sudo apt remove -y docker* rancher* podman*

    # Dangerous...
    for pkg in $(sudo apt list --installed 2>/dev/null | egrep -i 'docker|podman|rancher' | cut -d '/' -f 1); do
        echo "Removing package $pkg"
        sudo apt-get -y remove $pkg || true
    done

    # Uninstall ever cleans this
    rm -rf ~/.docker
    rm -rf ~/.rd

    # Remove docker bridge
    if ip a s docker0; then
        sudo ip link delete docker0
    fi

    echo "Review packages"
    sudo apt list --installed | egrep -i 'docker|podman|rancher'
}

show_remains() {
    if command -v docker; then
        echo "'docker' command is still present"
        docker ps -a
        docker images
    fi

    if ip a s docker0; then
        echo 'docker0 bridge is still there'
    fi
}

cleanup() {
     sudo apt autoremove -y
}

#read -p "Press enter to NUKE/PURGE ALL DOCKER IMPLEMENTATIONS!"

clean_slate
nuke_docker
cleanup
show_remains
