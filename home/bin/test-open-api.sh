#!/bin/bash

set -e

D=~/.private/open-api

S=~/local-bin/setup-open-api.sh
# The above file should set OPEN_API_KEY, e.g. like this:
# Per https://beta.openai.com/docs/api-reference/authentication
# Got the key from https://beta.openai.com/account/api-keys
#export set OPEN_API_KEY=""

setup() {
    if [ -f $S ]; then
        source $S
    fi
    echo ${OPEN_API_KEY} > /dev/null

    mkdir -p $D
    MODELS=$D/models.json
}

rpt() {
    echo "$1"
}

get_models() {
    #rpt "Get models"

    if [ ! -f $MODELS ]; then
        curl https://api.openai.com/v1/models \
             -H "Authorization: Bearer ${OPEN_API_KEY}" > $MODELS
    fi
}

show_models() {
    #cat $MODELS | jq .
    #cat $MODELS | jq '.data[] | .id,.owned_by'  | paste - - | tr -d '"' | tr "\t" ","
    cat $MODELS | jq '.data[] | .id'  | sort

    #ls -l $MODELS
}

setup
get_models
show_models
