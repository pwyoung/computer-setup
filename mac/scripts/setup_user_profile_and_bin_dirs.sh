#!/bin/sh

# GOAL: 
#   Imitate *nix /etc/profile.d pattern but for this user.
#   This makes it easier to maintain the scripts and to support multiple login shells (BASH, ZSH)
#
#   Also set up ~/bin
#   It's easier/faster to just put executable scripts in a dir than to reset PATH and deal with aliases...

MY_PATH=$( cd $(dirname "$0") && pwd )
USER_PROFILE_DIR=~/.profile.d
USER_BIN_DIR=~/bin

setup_user_profile_dir() {
    if [ ! -d "$USER_PROFILE_DIR" ]; then
	mkdir -p "$USER_PROFILE_DIR"
    fi
    
    # Use this in ~/.bash_profile and ~/.zsh_profile
    for F in ~/.bash_profile ~/.zprofile; do
	touch "$F"
	LABEL='Add-user-profile-to-login-shell'
	if ! grep "$LABEL" "$F" >/dev/null; then
	    echo "#${LABEL}" >> "$F" 
	    cat <<'EOF' >> "$F"
for i in `ls -1 ~/.profile.d/*.sh 2>/dev/null`; do
  source $i
done
EOF
	fi
    done

    # Copy files to ~/.profile.d
    D=$( cd ${MY_PATH}/../files/user_profile  && pwd )
    if [ ! -d $D ]; then
	echo "Directory $D does not exist"
	exit 1
    fi    
    cp $D/* $USER_PROFILE_DIR
    chmod 700 $USER_PROFILE_DIR/*
}

setup_user_bin_dir() {
    if [ ! -d "$USER_BIN_DIR" ]; then
	mkdir -p "$USER_BIN_DIR"
    fi

    # Copy files to ~/bin
    D=$( cd ${MY_PATH}/../files/user_bin  && pwd )
    if [ ! -d $D ]; then
	echo "Directory $D does not exist"
	exit 1
    fi
    cp $D/* $USER_BIN_DIR
    chmod 700 $USER_BIN_DIR/*
}

setup_user_profile_dir
setup_user_bin_dir

