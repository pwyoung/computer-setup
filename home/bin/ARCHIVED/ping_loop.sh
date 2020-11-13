#!/bin/sh
SEP="################################################################################"
for i in {1..999999}; do echo "$SEP\n$i\n$SEP";  ping -c 1 google.com; sleep 300; done
#while true; do ping -c 1 google.com; sleep 5; done
