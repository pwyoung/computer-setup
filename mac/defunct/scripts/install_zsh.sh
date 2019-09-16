#!/usr/local/bin/zsh
#Use the mac actual path, not /usr/bin/env zsh since that halts until zsh is properly configured

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

setup_prezto() {

    D=~/.zprezto
    echo "Setup $D"    
    if [ ! -d $D ]; then
	git clone --recursive https://github.com/sorin-ionescu/prezto.git ~/.zprezto
    fi
    echo "DIR="
    ls -ld $D/*
    
    F=~/.zshrc
    echo "Setup $F"        
    if [ ! -f $F ]; then
	setopt EXTENDED_GLOB

	for rcfile in "${ZDOTDIR:-$HOME}"/.zprezto/runcoms/^README.md(.N); do
	    ln -s "$rcfile" "${ZDOTDIR:-$HOME}/.${rcfile:t}"
	done
    fi
    
    F=~/.zpreztorc
    echo "Setup $F"        
    if [ -f $F ]; then
	cat <<'EOF' > $F
zstyle ':prezto:load' pmodule \
  'environment' \
  'terminal' \
  'editor' \
  'history' \
  'directory' \
  'spectrum' \
  'utility' \
  'completion' \
  'git' \
  'syntax-highlighting' \
  'history-substring-search' \
  'prompt'

zstyle ':prezto:module:prompt' theme 'paradox'
EOF
    fi
    
}

install_zsh(){
    brew_install "zsh"
    brew_install "zsh-completions"
}

brew_update
install_zsh
setup_prezto
