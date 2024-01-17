#!/bin/bash

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
    # The vpn command requires that the vpn agent is running first.
    if ! ps eax | grep -v grep | grep -i vpnagentd; then
        echo "The VPN Agent does not seem to be running"
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

# Set "AC_MFA"
get_mfa() {
    # The MFA token is for 'Insight Hubs'
    if [ "$1" == "" ]; then
        echo "Usage: $0 [MFA-value]"
        exit 1
    else
        AC_MFA="$1"
        echo "MFA: $AC_MFA"
    fi
}

read_secrets() {
    # Get parameters/creds
    #
    #export AC_HOST=
    #export AC_USER=
    #export AC_PASSWORD=
    #
    . $CREDS_FILE
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

check_vpn_binary
check_vpn_agent
check_state
get_mfa
read_secrets
connect_to_vpn
