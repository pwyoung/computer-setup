#!/bin/sh

setup_venv(){
    echo "python.sh: start"
    VENV_DIR=~/venv/python3

    if [ ! -d ${VENV_DIR} ]; then
        echo "Creating venv dir ${VENV_DIR}"
        python3 -m venv ${VENV_DIR}
    fi

    export set PYTHONIOENCODING=UTF-8
    export set PYTHONUNBUFFERED=1

    . ${VENV_DIR}/bin/activate

    echo "python.sh: end"
}

# Document this here in case we need it again
install_pyenv(){
    PKGS=build-essential libssl-dev zlib1g-dev libbz2-dev
    PKGS+=libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev
    PKGS+=xz-utils tk-dev libffi-dev liblzma-dev git
    PKGS+=openssl libssl-dev

    sudo apt-get install -y $PKGS

    pip install virtualenvwrapper

    git clone https://github.com/pyenv/pyenv.git ~/.pyenv
    git clone https://github.com/pyenv/pyenv-virtualenv.git ~/.pyenv/plugins/pyenv-virtualenv
    git clone https://github.co
}

setup_pyenv(){
    export PYENV_ROOT="$HOME/.pyenv"

    #export PATH="$PYENV_ROOT/bin:$PATH"
    export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"

    if command -v pyenv 1>/dev/null 2>&1; then
        eval "$(pyenv init -)"
    fi

    export PYENV_VIRTUALENVWRAPPER_PREFER_PYENV="true"
    export WORKON_HOME=$HOME/.virtualenvs
    eval "$(pyenv virtualenv-init -)"
    pyenv virtualenvwrapper_lazy
}

check_python(){
    ls -l `which python`
    python --version
    python -c"import ssl" # Check that this does not error out

    pyenv install --list

    # 3.8.12
    # pyenv install --list | grep 3.8
    # https://lmccrone.com/cheat-sheets-pyenv/
    # pyenv install 3.8.12

    pyenv versions
}

activate_pyenv(){
    echo "" >/dev/null

    # create an env
    #pyenv virtualenv 3.8.12 pyenv-3.8.12

    # delete env
    #pyenv virtualenv-delete 3.8.12/envs/pyenv-3.8.12
}

# setup_venv

# install_pyenv
setup_pyenv
# activate_pyenv
