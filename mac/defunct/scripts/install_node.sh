#!/bin/sh

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.                                                                                                                
brew_update
brew_install node

