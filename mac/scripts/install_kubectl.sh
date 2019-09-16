#!/bin/sh
# https://kubernetes.io/docs/tasks/tools/install-kubectl/

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

brew_install kubectl
kubectl config view # Test



