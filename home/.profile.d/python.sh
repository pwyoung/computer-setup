#!/bin/sh

VENV_DIR=~/venv/python3

if [ ! -d ${VENV_DIR} ]; then
    echo "Creating venv dir ${VENV_DIR}"
    python3 -m venv ${VENV_DIR}

    export set PYTHONIOENCODING=UTF-8
    export set PYTHONUNBUFFERED=1
fi

source ${VENV_DIR}/bin/activate
