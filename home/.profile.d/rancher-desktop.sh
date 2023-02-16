#!/bin/bash

if [ -e ~/.rd/bin ]; then
    RDBIN="$HOME"/.rd/bin
    export PATH="$RDBIN":$PATH
fi
