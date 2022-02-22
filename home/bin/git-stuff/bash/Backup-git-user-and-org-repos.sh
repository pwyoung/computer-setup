#!/bin/bash

# Set GITHUB_foo parameters
source ~/.private/github-api-setup.sh

if [ -z "$GITHUB_TOKEN" ]; then echo "GITHUB_TOKEN is not set" && exit 1; fi
if [ -z "$GITHUB_USER" ]; then echo "GITHUB_USER is not set" && exit 1; fi
if [ -n "$GITHUB_ORGS" ]; then echo "GITHUB_ORGS is set"; else echo "org is not set" && exit 1; fi

if [ -z "$GITHUB_REPO_LIST" ]; then echo "GITHUB_REPO_LIST is not set" && exit 1; fi
if [ -z "$GITHUB_TEMP_FILE" ]; then echo "GITHUB_TEMP_FILE is not set" && exit 1; fi


check_user() {
    curl -s -u ${GITHUB_USER}:${GITHUB_TOKEN} \
         -H "Accept: application/vnd.github.v3+json" \
         https://api.github.com/users/${GITHUB_USER} \
        | jq 'with_entries(select([.key] | inside(["public_repos", "email"])))'
}

clone_user_repo() {
    repo="$0"
    echo "Cloning user repo: $repo"

    REL_DIR=$(echo "$repo" | perl -pe 's/.*\/(.*?).git/$1/')
    DIR="${GITHUB_LOCAL_DIR}/${GITHUB_USER}/${REL_DIR}"
    if [ -d "${DIR}" ]; then
        pushd "${DIR}" >/dev/null
        git pull
        popd >/dev/null
    else
        git clone $i "${DIR}"
    fi
}

clone_user_repos() {
    URL="https://api.github.com/user/repos"
    curl -s -u ${GITHUB_USER}:${GITHUB_TOKEN} \
         -H 'Accept: application/vnd.github.v3+json' ${URL} \
         > ${GITHUB_TEMP_FILE}

    cat $GITHUB_TEMP_FILE \
        | jq -c '.[] | {name: .name, ssh_url: .ssh_url}' \
        | perl -pe 's/.*ssh_url...(.*?).}/$1/' \
               > ${GITHUB_REPO_LIST}

    for i in `cat "${GITHUB_REPO_LIST}"`; do
        echo "Repo: $i"
        clone_user_repo "$i"
    done
}

clone_org_repo() {
    ORG="$1"
    echo "Clone repos for ORG: $ORG"

    URL="https://api.github.com/orgs/${ORG}/repos"
    curl -s -u ${GITHUB_USER}:${GITHUB_TOKEN} \
         -H 'Accept: application/vnd.github.v3+json' ${URL} \
         > ${GITHUB_TEMP_FILE}

    cat $GITHUB_TEMP_FILE \
        | jq -c '.[] | {name: .name, ssh_url: .ssh_url}' \
        | perl -pe 's/.*ssh_url...(.*?).}/$1/' \
               > ${GITHUB_REPO_LIST}

    for i in `cat "${GITHUB_REPO_LIST}"`; do
        echo "Repo: $i"
        REL_DIR=$(echo "$i" | perl -pe 's/.*\/(.*?).git/$1/')
        DIR="${GITHUB_LOCAL_DIR}/${ORG}/${REL_DIR}"
        if [ -d "${DIR}" ]; then
            pushd "${DIR}" >/dev/null
            git pull
            popd >/dev/null
        else
            git clone $i "${DIR}"
        fi
    done
}

clone_org_repos() {
    echo "Cloning org repos: ${GITHUB_ORGS}"
    for i in $(echo ${GITHUB_ORGS} | tr ',' "\n"); do
        ORG="$i"
        echo "ORG: $ORG"
        clone_org_repo $ORG
    done
}

check_user
clone_user_repos
#clone_org_repos
