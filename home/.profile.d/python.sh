#!/bin/sh

# Python recommends "venv" (not pyenv) but
# venv doesn't seem to be able to install older versions
# of python unless I build them first and then use them to
# make a venv.
#
# Pyenv makes it easy to download many python versions. To see them, run:
#   pyenv install --list
# This includes [ana|mini]conda, pypy, and others
#
# It is also possible to use pyenv to get a python version,
# and then use venv as Python recommends, and then stop using pyenv
# and activate the resulting python version using venv.
#
# Pyenv has a virtualenv wrapper, but that seems overly complex given that we can
# remove pyenv completely after using it to make a venv we want
setup_venv(){
    VENV_DIR=~/venv/python3

    if [ ! -d ${VENV_DIR} ]; then
        echo "Creating venv dir ${VENV_DIR}"
        python3 -m venv ${VENV_DIR}
    fi

    export set PYTHONIOENCODING=UTF-8
    export set PYTHONUNBUFFERED=1

    . ${VENV_DIR}/bin/activate
}

install_pyenv(){
    PKGS=build-essential libssl-dev zlib1g-dev libbz2-dev \
        libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
        xz-utils tk-dev libffi-dev liblzma-dev git \
        openssl libssl-dev

    sudo apt-get install -y $PKGS

    git clone https://github.com/pyenv/pyenv.git ~/.pyenv
}

setup_pyenv(){
    export PYENV_ROOT="$HOME/.pyenv"

    export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"

    if command -v pyenv 1>/dev/null 2>&1; then
        eval "$(pyenv init -)"
    fi

}

install_pyenv_global_version(){
    pyenv install 3.8.12
    pyenv global 3.8.12
    pyenv versions
}

# Install as venv
# This supports running without pyenv and its shims
use_pyenv_to_install_venv_version() {
    cd ~/venv
    pyenv shell 3.8.12
    python3.8 -m venv 3.8.12
    echo "consider commenting out setup_pyenv and using setup_venv with this instead"
}


if [ "$1" == "pyenv" ]; then
    install_pyenv
    setup_pyenv
    install_pyenv_global_version
    use_pyenv_to_install_venv_version
fi

# Use Pyenv
setup_pyenv

# Use venv
#setup_venv

