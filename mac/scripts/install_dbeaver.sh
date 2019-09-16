#!/bin/sh

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

test_dbeaver() {
    #JAVA_HOME=`/usr/libexec/java_home -v 1.8`
    jenv shell 1.8
    dbeaver -vm ${JAVA_HOME}
}

brew_update
brew_cask_install dbeaver-community
test_dbeaver
