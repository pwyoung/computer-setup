#!/bin/sh

# GOAL: Configure Python

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

# Pin/specify versions
PYTHON_2_VER='2.7.14'
PYTHON_3_VER='3.6.3'
OPEN_SSL_VER='1.1'    

apps="pyenv gettext readline openssl@${OPEN_SSL_VER}"

install_homebrew_apps() {
    for i in $apps; do
	brew_install $i
    done
}

configure_python(){

    # This works, but pyenv output on bash shows nothing
    # jenv works properly when sourced from a script, why not this...?
    #
    # Assume the login script calls scripts in ~/.profile.d
    F=~/.profile.d/pyenv.sh
    cat <<'EOF' > $F
eval "$(pyenv init -)"
EOF
    source $F
    
#    LABEL='Configure-Pyenv'
#    for F in ~/.bash_profile ~/.zprofile; do
#	touch $F
#	if ! grep "$LABEL" $F >/dev/null; then
#	    echo "#${LABEL}" >> $F
#	    cat <<'EOF' >> $F
#eval "$(pyenv init -)"
#EOF
#	fi
#    done
#    source ~/.bash_profile
       
    pyenv install -s $PYTHON_2_VER
    pyenv install -s $PYTHON_3_VER
    pyenv versions

    # Set the default 
    pyenv global $PYTHON_2_VER

    pyenv rehash
}

# Commented out since this is not needed here/now, but left this here
# since the requirements.txt shows syntax to pull in Python modules from Github
#install_requirements(){
#    pyenv 
#    pip install -r ${MY_PATH}/../files/requirements.txt    
#}

brew_update
install_homebrew_apps
configure_python
#install_requirements
