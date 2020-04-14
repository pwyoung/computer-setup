#!/usr/bin/env bash
#
# GOAL: import the specified CA Cert file, $CERT_FILE, to the Java keychain
#  
# NOTES:
# - This should work in Cygwin and Linux, although it is only tested in Cygwin so far.

set -x
set -e

# This was exported from a browser
CERT_FILE=~/Downloads/nexus-cert.cer

# Check OS
if ! uname -a | egrep -i 'cygwin|linux' >/dev/null; then
    echo "Run this in Cygwin or Linux"
    exit 1
fi

# Report file to add
if [ ! -f "${CERT_FILE}" ]; then
    echo "Missing cert file: ${CERT_FILE}"
    exit 1
else
    echo "Adding cert file: ${CERT_FILE}"  
    ls -l "${CERT_FILE}"    
fi

# Set JAVA_HOME if it is not set
if [ -z "${JAVA_HOME}" ]; then
    echo "{JAVA_HOME} is undefined"
    if which java >/dev/null; then
        echo "Looking for keytool relative to 'java' executible"
    else
        echo "'java' is not in PATH. Giving up"
        exit 1    
    fi
    JAVA_BIN=$(which java)
    JAVA_BIN_DIR=$(dirname "${JAVA_BIN}")    
    JAVA_HOME=$(dirname "${JAVA_BIN_DIR}")  
    ls -ld "${JAVA_HOME}"      
fi

# Find, show, and test keytool executable
KEYTOOL=$(ls -1 "${JAVA_HOME}"/bin/keytool*)
"$KEYTOOL" -importcert -help

# Set CERT_FILE_TO_USE since we need the windows path in Cygwin
if uname -a | egrep -i 'cygwin' >/dev/null; then
  CERT_FILE_TO_USE=$(cygpath -w "${CERT_FILE}")
else
  CERT_FILE_TO_USE="${CERT_FILE}"
fi

# Import the cert to Java
"$KEYTOOL" -importcert -keystore "${JAVA_HOME}\jre\lib\security\cacerts" -storepass changeit -file "${CERT_FILE_TO_USE}" -alias wildcard-am -trustcacerts -noprompt  




