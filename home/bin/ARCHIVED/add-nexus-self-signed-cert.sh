#!/usr/bin/env bash
#
# Add the Nexus self-signed cert
#
# NOTE:
#   - This was run on Ubuntu on Docker (on HyperV) on Windows.
#   - For the windows and IntelliJ version of this task, see
#     - https://wiki.aciworldwide.com/display/~youngp/How+to+add+an+SSL+server%27s+certificate+to+a+Java+keystore


# On Linux (Ubuntu 18.04 at least), Java cacerts is a symlink to this file.
KEYSTORE='/etc/ssl/certs/java/cacerts'

if [ -z "$KEYSTORE" ]; then
    echo "KEYSTORE must be set"
    exit 1
else
    echo "KEYSTORE"
    ls -ld "${KEYSTORE}"*
    #cp "${KEYSTORE}" "${KEYSTORE}.ORIG"
fi

# Change these to the hostname and port of the SSL server
#HOST=cov3lphdpkafka04.am.tsacorp.com
#PORT=8081
HOST=nexus.am.tsacorp.com
PORT=443
#
# This is a useful naming convention. We assume this is the only interesting info about this cert.
ALIAS=$HOST-$PORT
# These are just relative file names since we will be in the directory containing the keystore.
CERT=$ALIAS.pem

PASSWORD="changeit"

# Get the Cert for the server
keytool -J-Djava.net.useSystemProxies=true -printcert -rfc -sslserver $HOST:$PORT > "$CERT"
# Import Cert
keytool -importcert -file "$CERT" -alias $ALIAS -storepass $PASSWORD -keystore "$KEYSTORE"
# Test: Importing again should show an error that the cert is already installed
keytool -importcert -file "$CERT" -alias $ALIAS -storepass $PASSWORD -keystore "$KEYSTORE"
# Show the cert
keytool -list -v -keystore "$KEYSTORE" -storepass $PASSWORD | grep "$ALIAS"
