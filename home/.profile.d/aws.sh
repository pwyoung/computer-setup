#!/bin/bash

if ! which aws >/dev/null; then
    # echo "Using Docker to run aws since the aws command is not installed"

    # Setup Aliases for AWS stuff

    # Official (alpine/dash based) image
    #IMAGE="amazon/aws-cli:latest"
    # My image
    IMAGE="aws-tools:latest"

    SHARED=/tmp/shared && mkdir -p $SHARED

    # If $DOT_AWS is defined then use it
    if [ -z "$DOT_AWS" ]; then
        DOT_AWS=$HOME/.aws
    fi

    if [ -f ~/bin/aws ]; then
        echo "use ~/bin/aws to run aws commands"
        unalias aws
    else
        alias aws="docker run -t -i --rm -v $SHARED:$SHARED -v $DOT_AWS:/home/dev/.aws $IMAGE /usr/local/bin/aws-v2"
    fi

    alias aws-shell="docker run -t -i --rm -v $DOT_AWS:/home/dev/.aws $IMAGE /usr/bin/bash -c 'aws-shell'"

    alias aws-docker-login="docker run -t -i --rm -v $DOT_AWS:/home/dev/.aws $IMAGE bash"
fi
