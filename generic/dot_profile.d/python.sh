#!/bin/sh

VENV_DIR=~/venv/python3

if [ ! -d ${VENV_DIR} ]; then
    echo "Creating venv dir ${VENV_DIR}"
    python3 -m venv ${VENV_DIR}
fi

source ${VENV_DIR}/bin/activate
