#!/bin/bash

# Setup Aliases for AWS stuff

# Official (alpine/dash based) image
#IMAGE="amazon/aws-cli:latest"
# My image
IMAGE="aws-tools:latest"

SHARED=/tmp/shared && mkdir -p $SHARED

if [ -z "$DOT_AWS" ]; then
    DOT_AWS=$HOME/.aws
fi

AWS=/usr/local/bin/aws-v2
alias aws="docker run -t -i --rm -v $SHARED:$SHARED -v $DOT_AWS:/home/dev/.aws $IMAGE /usr/local/bin/aws-v2"

alias aws-shell="docker run -t -i --rm -v $DOT_AWS:/home/dev/.aws $IMAGE /usr/bin/bash -c 'aws-shell'"

alias aws-docker-login="docker run -t -i --rm -v $DOT_AWS:/home/dev/.aws $IMAGE bash"
