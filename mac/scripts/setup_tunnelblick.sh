#!/bin/sh

# GOAL:
#   Make it easy to set up the VPN.
#   This script is intended to be idempotent/re-runnable, doing no extra work, as long as the tarball output dir is not removed.
#
# ASSUMPTIONS:
#  This assumes the Tunnelblick config file is in TARBALL
#  This assumes that CONFIG can be derived from the TARBALL using the logic below
#  This assumes that some installation artifacts are a function of CONFIG as described below


TARBALL=~/Downloads/tunnel_blick_config.tgz # Installer file
CONFIG='' # Leave this empty to extract from the tarball

config() {
    if [ ! -f $TARBALL ]; then
	echo "Specify the tarball location"
	read TARBALL
    fi
    echo "TARBALL=$TARBALL"    
    if [ ! -f $TARBALL ]; then
	echo "Get the VPN config file, and put it in $TARBALL"
	exit 1
    fi

    if [ "$CONFIG" = '' ]; then
	echo "Get the config file the tarball, using some assumptions (first UDP cert found, etc)"
	LINE=$(tar tvzf "$TARBALL"  | grep crt | grep UDP | head -1)
	echo "Extracting CONFIG from $LINE"    
	CONFIG=$(echo $LINE | perl -pe 's/.*UDP\/(.*?).tblk.*/$1/')
	if echo "$CONFIG" | grep ' ' >/dev/null; then
	    echo "Failed to set the CONFIG from the tarball"
	    exit 1
	fi
    fi
    echo "CONFIG=$CONFIG"
    
    TUNNELBLICK_CONFIG_DIR=~/Library/Application\ Support/Tunnelblick/Configurations/${CONFIG}.tblk # Created by Tunnelblick after installing the config
    KEYCHAIN_ENTRIES="Tunnelblick-Auth-${CONFIG}" # Created by OSX when Tunnelblick GUI adds credentials for the connection to the keychain. 
    
    UNTARRED_DIR=~/Tunnelblick/$CONFIG # Persist the tarball output here, so we can rerun this script after cleaning up other files/dirs
    TUNNELBLICK_CONFIG_FILE=${UNTARRED_DIR}/UDP/${CONFIG}.tblk # Assume we want to install this config

    TUNNELBLICK_APP='/Applications/Tunnelblick.app'
}

ensure_tunnelblick_is_running() {
    openvpn_is_running="$( echo "${processes}" | grep -w /openvpn | grep -v grep )"
    if [ "${openvpn_is_running}" != "" ] ; then
	open $TUNNELBLICK_APP
	exit
    fi
}    

install_tunnelblick() {
    if [ ! -d $TUNNELBLICK_APP ]; then
	brew cask install tunnelblick
    fi
}

install_vpn_config() {
    if [ ! -d "$TUNNELBLICK_CONFIG_DIR" ]; then
	echo "Missing TUNNELBLICK_CONFIG_DIR, $TUNNELBLICK_CONFIG_DIR"
	if [ ! -d ${UNTARRED_DIR} ]; then
	    echo "Missing UNTARRED_DIR, ${UNTARRED_DIR}"
	    if [ ! -f $TARBALL ]; then
		echo "Get the VPN config file, and put it in $TARBALL"
		exit 1
	    fi
	    # Force the contents to go into $UNTARRED_DIR
	    mkdir -p $UNTARRED_DIR && tar xvzf $TARBALL --strip-components=1 -C $UNTARRED_DIR 
	fi
	ensure_tunnelblick_is_running
	echo "Hit enter and follow GUI to install the VPN connection config"
	read OK
	if [ -d $TUNNELBLICK_CONFIG_FILE ]; then
	    open $TUNNELBLICK_CONFIG_FILE
	else
	    echo "Failed to find TUNNELBLICK_CONFIG_FILE at $TUNNELBLICK_CONFIG_FILE"
	    exit 1
	fi
    fi
}

add_user_credentials_to_config() {
    ensure_tunnelblick_is_running
    
    LINES=$( security dump-keychain | grep "${KEYCHAIN_ENTRIES}" | wc -l)    
    if [ $LINES -eq 0 ]; then
	echo "I don't see a keychain entry for the Tunnelblick config"
	echo "Assuming you need to enter your user creds for this connection."

	NOTES=~/tunnelblick_notes.txt
	cat <<EOF > $NOTES
Use Tunnelblick GUI to establish the VPN connection...

Open Tunnelblick (click on upside-down U looking icon in menubar)
Click connect on the config (for $CONFIG)
Connect with username / passphrase , given offline
Follow GUI:
  - Accept defaults 
  - Add keys to keychain
  - Ignore warning about IP address not changing
    
EOF

	open $NOTES
    
	echo "Hit enter after establishing the VPN connection"
	read OK
    fi
}

config
install_tunnelblick
install_vpn_config
add_user_credentials_to_config


