#!/bin/sh


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
