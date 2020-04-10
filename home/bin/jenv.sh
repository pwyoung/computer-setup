#!/bin/bash

# This should be in ~/.bash_profile, but on Cygwin, it causes a 3 second delay after each
# command before the prompt shows up again.
# So, source this file on Cygwin if it is needed

# https://developer.bring.com/blog/configuring-jenv-the-right-way/
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
#
# SET JAVA_HOME (for Maven, etc)
#jenv enable-plugin maven
#jenv enable-plugin export
