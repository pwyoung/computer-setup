#!/bin/sh

################################################################################
# PYENV
################################################################################
# SNAFU:
#   Situation:
#     - 'pyenv global 3.7.4' does not update ~/.python-version
#       - it updates ~/.pyenv/version
#     - ~/.python-version supercedes ~/.pyenv/version
#     - This conflict is why 'pyenv version' tells you which file is setting the version
#       - This is nuts, but probably exists for 'legacy reasons'
#   Conclusion:
#     - We shoud remove ~/.python-version if it exists
#
#rm -f ~/.python-version

#export PYENV_ROOT=~/.pyenv
#if which pyenv > /dev/null; then eval "$(pyenv init -)"; fi
################################################################################

VENV_DIR=~/venv/python3

if [ ! -d ${VENV_DIR} ]; then
    echo "Creating venv dir ${VENV_DIR}"
    python3 -m venv ${VENV_DIR}
fi

source ${VENV_DIR}/bin/activate
