#!/bin/bash

# Rust (todo. move to ~/.profile.d/rust.sh if possible. test since maybe this failed b4)
if [ -d $HOME/.cargo ]; then
    . "$HOME/.cargo/env"
fi

