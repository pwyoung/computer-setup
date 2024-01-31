#!/bin/bash

################################################################################
# Server
################################################################################
export EXPORTDIR='/mnt/export/myshareddir'

export SERVER='192.168.3.234'
export CIDR='192.168.3.0/255.255.255.0'

# Admin user (has passwordless sudo)
export SSH_TGT="pyoung@$SERVER"

################################################################################
# Clients
################################################################################

# Mount locally here
export LOCALDIR='/mnt/import/myshareddir'

# Clients
#
# Test with local machine
export SSH_TGTS="localhost"
#
# One remote machine
#export SSH_TGTS="ubuntu@192.168.3.201"
#
# All machines
#export SSH_TGTS="ubuntu@192.168.3.201 ubuntu@192.168.3.195 ubuntu@192.168.3.191 ubuntu@192.168.3.192 ubuntu@192.168.3.194"



