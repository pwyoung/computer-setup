#!/usr/bin/env bash

check_az_login() {
    if ! az account list 2>&1 ; then
	echo "Failed to run 'az account list'. Log in using 'az login'"
	exit 1
    fi
}

get_user_conf() {
    echo "WARNING: This will delete ALL azure subscriptions ..."
    echo "and resource groups in this AZ mgmt group"
    read -p "Type YES and hit enter to continue: " X

    if [ ! "$X" == "YES" ]; then
	echo "NOT running azure nuke"
	exit 2
    fi
}

show_resource_groups_to_delete() {
    echo "About to show resource groups that will be deleted"
    for sub in `az account list | jq -r '.[].id'`; do
	for rg in `az group list --subscription $sub | jq -r '.[].name'`; do
	    echo "WILL RUN: az group delete --name ${rg} --subscription $sub --no-wait --yes"
	done
    done
}

delete_resource_groups() {
    echo "About to show resources that will be deleted"
    for sub in `az account list | jq -r '.[].id'`; do
	for rg in `az group list --subscription $sub | jq -r '.[].name'`; do
	    echo "About to run: az group delete --name ${rg} --subscription $sub --no-wait --yes"
            az group delete --name ${rg} --subscription $sub --no-wait --yes
	done
    done
}

show_sep() {
    SEP="################################################################################"
    echo "$SEP"
}

show_sep
check_az_login

show_sep
show_resource_groups_to_delete

show_sep
get_user_conf

show_sep
delete_resource_groups

