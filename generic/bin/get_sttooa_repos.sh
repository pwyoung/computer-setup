#!/bin/sh

# Useful Resources
#   https://github.com/settings/tokens
#   https://developer.github.com/v3/repos/#list-your-repositories

ORG='STTOOA'
REPO_DIR=/repos/BACKUP_STTOOA/$ORG

REPO_LIST_FILE=~/.sttooa_repo_list.txt

if [ ! -d $REPO_DIR ]; then
    echo "REPO_DIR, $REPO_DIR, does not exist"
    exit 1
fi
cd $REPO_DIR

SEP="################################################################################"
REPOS=$(cat ${REPO_LIST_FILE})
#REPOS="omnia-lab k8s-kafka"
for i in $REPOS; do
    echo "$SEP"
    echo "$i"
    echo "$SEP"
    if [ -d ./$i ]; then
        pushd ./$i
        git pull
        popd
    else
        git clone git@github.com:STTOOA/${i}.git
        RC=$?
        if [ $RC -ne 0 ]; then
            echo "" > ./FAIL_${i}
        fi
    fi
done
