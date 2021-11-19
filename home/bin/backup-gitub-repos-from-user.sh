#!/usr/bin/bash

set -e

# GOAL: Backup github repos

# References:
#   Github API
#     https://docs.github.com/en/free-pro-team@latest/rest/reference/repos
#   Github PAT
#     https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token

################################################################################
# ARGS
################################################################################

# Github Username
GHUSER="$1"
if [ "$GHUSER" == "" ]; then
    echo "Usage: $0 <GHUSER>"
    exit 1
fi

################################################################################
# PARAMETERS (likely need to be edited)
################################################################################

# Destination dir
DEST_DIR=/data/backups/repos/github/${GHUSER}

################################################################################
# ADDITIONAL VARIABLES (not likely to need to be edited)
################################################################################

# Github Personal Access Token
PAT=~/.github-personal-access-token

JQ=jq # Consider using 'npx jq' for some users

# Repo info fetched from Github
REPO_DATA_FILE=~/.github-repo-data.${GHUSER}

# List of github urls to clone
REPO_LIST_FILE=~/.github-repo-list.${GHUSER}

# If "YES" and $REPO_DATA_FILE exists, then use the existing $REPO_DATA_FILE
#REUSE_REPO_DATA='YES'
REUSE_REPO_DATA='NO'

################################################################################

check_pat() {
    echo "Checking for personal-access-token (PAT)"
    wc -lc $PAT || (echo "Install Github personal access token at $PAT" && \
			echo "See https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token")
}

get_repo_data() {
    if [ -f $REPO_DATA_FILE ]; then
	if [ "${REUSE_REPO_DATA}" == "YES" ]; then
	    echo "$REPO_DATA_FILE exists, using it as-is"
	    return
	fi
    fi
    GITHUB_API_TOKEN=$(cat $PAT)
    curl -s -H "Authorization: token $GITHUB_API_TOKEN" "https://api.github.com/users/${GHUSER}/repos?page=1&per_page=300" > ${REPO_DATA_FILE}
}

create_repo_list() {
    cat ${REPO_DATA_FILE} | $JQ -r '.[].clone_url' > $REPO_LIST_FILE # HTTPS urls
    #cat ${REPO_DATA_FILE} | $JQ -r '.[].ssh_url' > $REPO_LIST_FILE # SSH urls
}

clone_repos() {
    mkdir -p ${DEST_DIR}

    SEP="################################################################################"
    REPOS=$(cat ${REPO_LIST_FILE})
    for i in $REPOS; do
	echo "$SEP"
	echo "$i"
	echo "$SEP"
	DIR=$(echo $i | perl -pe 's/.*\/(.*).git/$1/')
	if [ -d $DEST_DIR/$DIR ]; then
	    echo "Git update $DEST_DIR/$DIR"
            cd ${DEST_DIR}/$DIR
            git fetch --all
	    git merge --ff-only
	else
            cd ${DEST_DIR}
	    echo "Clone $i"
            git clone $i
	fi
    done
}

show_repos(){
    echo "All repos, sorted by size"
    du -sh ${DEST_DIR}/* | sort -h
    echo "All repos, total size"
    du -sh ${DEST_DIR}
}

check_pat
get_repo_data
create_repo_list
clone_repos
show_repos
