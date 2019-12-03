#!/bin/bash

if [ $# -ne 1 ]; then
        echo "Usage: $0 <submodule full name>"
        exit 1
fi

MODULE_NAME=$1

remove_module_from_config() {
    git config -f .gitmodules --remove-section submodule.$MODULE_NAME
    git add .gitmodules
    git config -f .git/config --remove-section submodule.$MODULE_NAME
}

remove_module_directory() {
    git rm --cached $MODULE_NAME
    rm -rf .git/modules/$MODULE_NAME
    rm -rf $MODULE_NAME
}

remove_module_from_config
 remove_module_directory
