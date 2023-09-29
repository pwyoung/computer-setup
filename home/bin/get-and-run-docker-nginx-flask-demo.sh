#!/bin/sh

# GOAL:
#   Automate use of the repo here:
#     https://github.com/alros/docker-nginx-flask-demo
#
# LESSONS:
#   This shows how to create a self-signed cert
#   This shows how to tell the Ubuntu host how to trust that cert
#   This shows how to configure nginx

PROJECT="pwytest"

# NIC="enp3s0"
NIC=$(nmcli | grep -i 'wired connection' | head -1 | cut -d ':' -f 1)

# HOST_IP=192.168.3.231
HOST_IP=$(ip a s $NIC | head -3 | tail -1  | awk '{print $2}' | cut -d '/' -f 1)

# Original
#REPO="https://github.com/alros/docker-nginx-flask-demo"
# Fork (just in case the orig disappears)
REPO="https://github.com/pwyoung/docker-nginx-flask-demo"

use_git_repo() {
    if [ -e ./docker-nginx-flask-demo ]; then
        echo "repo exists"
        cd ./docker-nginx-flask-demo
    else
        git clone $REPO
        cd ./docker-nginx-flask-demo
    fi

    if ! git remote -v | grep "docker-nginx-flask-demo"; then
        echo "Error: we are not in the git repo dir"
        exit 1
    fi
}

cleanup() {
    docker-compose kill

    rm -rf ./*.pem
    rm -rf ./*.crt
    rm -rf ./*.key
}

make_cert() {
    echo "HOST_IP=$HOST_IP"

    # The app fails if we rename the key and cert files (from .pem extensions)
    # The file names are hard-coded in:
    #   - docker-compose.yml
    #   - nginx.conf
    openssl req -x509 -nodes -newkey rsa:2048 -keyout key.pem -out cert.pem -sha256 -days 365 \
            -subj "/C=US/ST=MA/L=Boston/O=SomeOrg/OU=SomeBizUnit/CN=${HOST_IP}"
}

tell_host_to_trust_cert() {
    # https://ubuntu.com/server/docs/security-trust-store

    # This should be done already
    #sudo apt-get install -y ca-certificates

    # This is the private key. It is not needed here.
    #KEY=${PROJECT}-selfsigned.key
    #
    # This is the public certificate.
    #CRT=${PROJECT}-selfsigned.pem # Fails... due to bad extension
    CRT=${PROJECT}-selfsigned.crt # This needs to be named with the ".crt" extension. ".pem" fails

    sudo cp -f ./cert.pem /usr/local/share/ca-certificates/$CRT
    sudo update-ca-certificates
}

build_docker_image() {
    docker build . -t my_app
}

run_docker_compose() {
    docker-compose up --detach
}

test_it() {
    echo "This ignores bad certs"
    curl --insecure https://${HOST_IP}

    sleep 1

    echo "This requires good certs"
    curl https://${HOST_IP}
}

show_cert() {
    echo "Show the cert(s) for our host ip (${HOST_IP})"
    awk -v cmd='openssl x509 -noout -subject' '    /BEGIN/{close(cmd)};{print | cmd}' < /etc/ssl/certs/ca-certificates.crt \
        | grep "${HOST_IP}"
}

use_git_repo
cleanup
make_cert
build_docker_image
tell_host_to_trust_cert
show_cert
run_docker_compose
test_it

