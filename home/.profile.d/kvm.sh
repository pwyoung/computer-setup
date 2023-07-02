#!/bin/bash

# Tell the user if/when the setuid bit is turned off
# for the helper program we need to run qemu user sessions
# with bridged networking.

if command -v kvm >/dev/null; then

    L=$HOME/kvm.sh.out

    F=/usr/lib/qemu/qemu-bridge-helper

    if [ ! -u "$F" ]; then
        D=$(date)
        cat <<EOF | tee -a $L
$D
$F does not have setuid set
Run the following to fix this:
  sudo chmod +s $F

NOTE:
  The setuid bit must be turned on for the helper program
  to support qemu user sessions with bridged networking.
EOF
    fi

fi
