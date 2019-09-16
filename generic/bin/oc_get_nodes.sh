#!/bin/sh
#
# Add a node
#
# https://docs.openshift.com/enterprise/3.0/cli_reference/get_started_cli.html#basic-setup-and-login

#oc login -u system:admin -n kube-system
#oc login -u system:admin -n default
oc login -u system:admin 


oc get nodes
