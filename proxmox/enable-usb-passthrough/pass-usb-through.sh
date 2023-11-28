#!/bin/bash

# TODO

choose_device() {

lsusb
cat <<EOF
Bus 002 Device 004: ID 05e3:0625 Genesys Logic, Inc. USB3.2 Hub
Bus 002 Device 003: ID 05e3:0625 Genesys Logic, Inc. USB3.2 Hub
Bus 002 Device 002: ID 174c:3074 ASMedia Technology Inc. ASM1074 SuperSpeed hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 005: ID 05e3:0610 Genesys Logic, Inc. Hub
Bus 001 Device 004: ID 0b05:1a97 ASUSTek Computer, Inc. USB Audio
Bus 001 Device 003: ID 05e3:0610 Genesys Logic, Inc. Hub
Bus 001 Device 013: ID 8087:0038 Intel Corp.
Bus 001 Device 011: ID 0b05:19af ASUSTek Computer, Inc. AURA LED Controller
Bus 001 Device 008: ID 1e71:300c NZXT NZXT Kraken Elite
Bus 001 Device 009: ID 1e71:2011 NZXT NZXT RGB & Fan Controller
Bus 001 Device 006: ID 05e3:0608 Genesys Logic, Inc. Hub
Bus 001 Device 002: ID 174c:2074 ASMedia Technology Inc. ASM1074 High-Speed hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
EOF

# Disconnect mouse/keyboard/usb-ub
lsb > /tmp/x1
# Cnnect mouse/keyboard/usb-ub
lsb > /tmp/x2
# Find devices
diff /tmp/x1 /tmp/x2<<EOF
> Bus 001 Device 024: ID 046d:c245 Logitech, Inc. G400 Optical Mouse
> Bus 001 Device 023: ID 045e:07a5 Microsoft Corp. Wireless Receiver 1461C
> Bus 001 Device 022: ID 1a40:0101 Terminus Technology Inc. Hub
EOF


}
