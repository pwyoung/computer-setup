#!/bin/sh

echo "This only gets 30 repos. I don't know why. TODO: fixme"
sleep 5

# Useful Resources
#   https://github.com/settings/tokens
#   https://developer.github.com/v3/repos/#list-your-repositories

ORG='STTOOA'
REPO_DIR=/repos/$ORG
GITHUB_TOKEN_SCRIPT=~/.secrets/github_token.sh # sets GITHUB_TOKEN 
TEMPDIR=~/.tmp/github

TEMPFILE=$TEMPDIR/repolist.${ORG}.txt
source $GITHUB_TOKEN_SCRIPT

if [ ! -d $REPO_DIR ]; then
    echo "REPO_DIR, $REPO_DIR, does not exist"
    exit 1
fi
cd $REPO_DIR

mkdir -p $TEMPDIR
URL="https://api.github.com/orgs/${ORG}/repos"
curl -u $GITHUB_TOKEN:x-oauth-basic $URL > $TEMPFILE
SEP='--------------------------------------------------------------------------------'
for i in `cat $TEMPFILE | jq -r .[].ssh_url`; do
    echo "$SEP"
    echo $i
    echo "$SEP"    
    D=$(echo $i | perl -pe 's/^.*\/(.*).git$/$1/')
    if [ -d $D ]; then
	pushd $D >/dev/null
	git pull
	popd >/dev/null
    else
	git clone $i
    fi
done
