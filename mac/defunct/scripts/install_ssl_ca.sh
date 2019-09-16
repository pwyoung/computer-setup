#!/bin/sh

################################################################################
error_handler () {
    RC=$?
    echo "Error $RC, at $BASH_COMMAND, line ${BASH_LINENO[0]}"
    exit $RC
}
trap error_handler ERR

################################################################################

# Uncomment to use previous output
#DEV_SKIP_CONNECTION='TRUE'

TMP_DIR=~/.tmp/install_my_ca

REPO_DIR=${TMP_DIR}/repos
MY_LAB_DIR=${REPO_DIR}/my-lab
CERT=${MY_LAB_DIR}/'labs/us01.ooa/ca/us01+ooa+sttgts+com.crt'

CERT_INFO=${TMP_DIR}/my_cert_info.txt
OPENSSL_ATTEMPT=${TMP_DIR}/openssl_attempt_to_access_docker.output.txt

KEYCHAIN_ENTRY="us01CA" # This is the name of entry in the OSX Keychain
################################################################################

show_cert_in_keychain() {
    LINES=$( security dump-keychain | grep "${KEYCHAIN_ENTRY}" | wc -l)
    if [ $LINES -eq 0 ]; then
        echo "I don't see a keychain entry matching $KEYCHAIN_ENTRY"
	#open /Applications/Utilities/Keychain\ Access.app
    else
	echo "Ok, you have a Key, $KEYCHAIN_ENTRY"
    fi
}

add_my_ca(){

    if [ ! -d $MY_LAB_DIR ]; then
	cd $REPO_DIR
	git clone git@github.com:STTOOA/my-lab.git
    else
	cd $REPO_DIR
	git pull
    fi

    if [ ! -f "$CERT" ]; then
	echo "CERT does not exist: $CERT"
	exit 1
    fi

    # Show cert info
    openssl x509 -in $CERT -noout -text | tee $CERT_INFO # Cert info

    # Add to cert to System keychain
    sudo security add-trusted-cert -d -k /Library/Keychains/System.keychain -r trustRoot "$CERT"
}

test_my_ca() {
    if [ "$DEV_SKIP_CONNECTION" = "TRUE" ] && [ -f $OPENSSL_ATTEMPT ]; then
	echo "Using the previous attempt's output, $OPENSSL_ATTEMPT"
    else
	openssl s_client -showcerts -servername docker.io.lab -connect docker.io.lab:443 | tee $OPENSSL_ATTEMPT
    fi

    if grep 'Verify return code: 19 (self signed certificate in certificate chain)' $OPENSSL_ATTEMPT >/dev/null; then
	echo "Looks like you need to add the cert"
	add_my_ca
    else
	echo "Looks like the cert is working for you"
    fi
}

mkdir -p $REPO_DIR
test_my_ca # Install if it's not there
show_cert_in_keychain
