#!/bin/bash

#https://www.if-not-true-then-false.com/2015/fedora-nvidia-guide/

#http://download.nvidia.com/XFree86/Linux-x86_64/430.40/README/installdriver.html#modulesigning



################################################################################
# Generate keys to sign the nvidia driver
################################################################################
# http://www.pellegrino.link/2015/11/29/signing-nvidia-proprietary-driver-on-fedora.html

CFG=x509-configuration.ini

cat <<EOF > $CFG
[ req ]
default_bits = 4096
distinguished_name = req_distinguished_name
prompt = no
string_mask = utf8only
x509_extensions = myexts

[ req_distinguished_name ]
O = pyoung
CN = pyoung
emailAddress = phil.w.young@gmail.com

[ myexts ]
basicConstraints=critical,CA:FALSE
keyUsage=digitalSignature
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
EOF

SECRETKEY=private_key.priv
PUBKEY=public_key.der
#NVIDIA-Linux-x86_64-430.50.run -s --module-signing-secret-key=$SECRETKEY --module-signing-public-key=$PUBKEY

if [ ! -e $SECRETKEY ]; then
    openssl req -x509 -new -nodes -utf8 -sha256 -days 36500 -batch -config x509-configuration.ini -outform DER -out $PUBKEY -keyout $SECRETKEY
fi

# Put on USB
#   https://discussions.apple.com/thread/8132218

echo "sh ./NVIDIA-Linux-x86_64-430.50.run -s --module-signing-secret-key=$SECRETKEY --module-signing-public-key=$PUBKEY"
