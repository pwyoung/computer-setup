#!/bin/sh

# Ignore
#  .vagrant
#ARGS='--exclude --exclude'
#ARGS+='--progress'

rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ss:/repos/pyoung /repos/pyoung

#rsync -avz -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ss:/repos/pwyoung /repos/pwyoung


