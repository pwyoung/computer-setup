#!/bin/bash

GIT_REPO_PREFIX='https://github.com/<ORG-CHANGEME>'
REPO_LIST=./.repo-list.txt

# Make this 1 to enforce min times, 0 to skip them
ENFORCE_MIN_TIMES=1

# Do not update a repo if it has a modification time within this many seconds
REPO_MIN_MOD_SECONDS=$((2 * 60 * 60 * $ENFORCE_MIN_TIMES))

# Do not update the repo list if it has a modification time within this many seconds
REPOLIST_MIN_MOD_SECONDS=$((2 * 60 * 60 * $ENFORCE_MIN_TIMES))

fetch_repo_list() {
    if [ -e $REPO_LIST ]; then
        NOW=$(date +%s)
        MODIFIED=$(date -r "$REPO_LIST" "+%s")
        SECONDS_SINCE_MODIFIED=$(expr $NOW - $MODIFIED)
        if [ $SECONDS_SINCE_MODIFIED -le $REPOLIST_MIN_MOD_SECONDS ]; then
            echo "Repo list was updated recently. Not re-pulling it"
            return
        fi
    fi

    # Recreate file list
    gh repo list -L 300 Insight-NA > $REPO_LIST
}

update_repo() {
    i="$1"

    NOW=$(date +%s)
    MODIFIED=$(date -r ./"$i" "+%s")
    SECONDS_SINCE_MODIFIED=$(expr $NOW - $MODIFIED)
    if [ $SECONDS_SINCE_MODIFIED -le $REPO_MIN_MOD_SECONDS ]; then
        echo "Skipping $i since it was updated recently"
        return
    fi

    pushd ./$i >/dev/null && git fetch --all && git pull --ff-only && popd > /dev/null
}

create_repo() {
    i="$1"
    git clone $GIT_REPO_PREFIX/$i
}

fetch_repos() {
    SEP="--- "
    for i in `cat $REPO_LIST | perl -pe 's/^(.*?)[\t].*$/$1/' | cut -d'/' -f 2`; do
        #echo $i
        if [ -e ./$i ]; then
            echo "$SEP $i: updating repo"
            update_repo "$i"
        else
            echo "$SEP $i: creating repo"
            create_repo "$i"
        fi
    done
}

scan_for_openai() {
    F=~/egrep.chatgpt.openai.out
    egrep -ir 'chatgpt|openai' > $F
}

fetch_repo_list
fetch_repos
scan_for_openai

