#!/bin/bash

PYTHON_MAJOR_VERSION="3.11"
PYTHON_VERSION="${PYTHON_MAJOR_VERSION}.4"

install_pyenv(){
    if command -v pyenv; then
        echo "pyenv is already installed"
    else
        echo "Installing pyenv"
        if uname -a | grep Linux >/dev/null; then
            # POPOS 22.04
            PKGS=make build-essential libssl-dev zlib1g-dev \
                      libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev \
                      libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python3-openssl

            sudo apt-get install -y $PKGS

            git clone https://github.com/pyenv/pyenv.git ~/.pyenv
        elif uname -a | grep Darwin >/dev/null; then
            brew install pyenv
        fi
    fi

}

install_pyenv_global_version(){
    pyenv install -v ${PYTHON_VERSION}
    pyenv global ${PYTHON_VERSION}
    pyenv versions
}

install_pyenv
install_pyenv_global_version
