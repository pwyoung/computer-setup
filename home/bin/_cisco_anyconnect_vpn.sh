#!/bin/bash

set -e

# Binary to run to establish the connection
VPN=/opt/cisco/secureclient/bin/vpn

# This exports parameters/secrets for the connection
CREDS_FILE=~/.private.anyconnect.sh

check_vpn_binary() {
    if [ ! -e $VPN ]; then
        echo "vpn binary [$VPN] does not exist"
        exit 1
    fi
}

check_vpn_agent() {
    if ! ps eax | grep -v grep | grep -i vpnagentd; then
        echo "The VPN Agent does not seem to be running"
        echo "$VPN will not work properly"
        exit 1
    fi
}

check_state() {
    N=$($VPN state | grep 'state: Connected' | wc -l)
    if [ $N -gt 1 ]; then
        echo "VPN seems to already be connected"
        echo "Run '$VPN disconnect' to disconnect"
        echo "Exiting"
        exit 0
    fi
}

read_secrets() {
    # Get parameters/creds
    . $CREDS_FILE
    echo "AC_HOST=$AC_HOST"
    echo "AC_USER=$AC_USER"
    echo "AC_PASSWORD length=${#AC_PASSWORD}"
}

connect_to_vpn() {
    $VPN -s connect $AC_HOST <<EOF
$AC_USER
$AC_PASSWORD
$AC_MFA
y
exit
EOF
}

if [ "$1" == "" ]; then
    echo "Usage: $0 <MFA-value>"
    exit 1
else
    AC_MFA="$1"
    echo "MFA: $AC_MFA"
fi

check_vpn_binary
check_vpn_agent
check_state
read_secrets
connect_to_vpn
