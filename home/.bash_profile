#!/bin/bash

# Common setup
if [ -e ~/.profile.d ]; then
    SCRIPTS=$(ls -1 ~/.profile.d/*.sh 2>/dev/null)
fi
for i in $SCRIPTS; do
    #echo "Running $i"
    #source $i
    source $i &>/dev/null
done

# Private/Sensitive and custom config
if [ -e ~/.private.d ]; then
    PWSCRIPTS=$(ls -1 ~/.private.d/*.sh 2>/dev/null)
fi
for i in $PWSCRIPTS; do
    source $i &>/dev/null
done
if [ -e ~/bin-local ]; then
    PATH=~/bin-local:$PATH
fi

if [ -e ~/bin ]; then
    PATH=~/bin:$PATH
fi

# Moved to ~/.profile.d/z
#alias z='cd $(cat ~/.marked_path)'

################################################################################
# PROMPT (PS1)
################################################################################
#export PS1='\h:\W \u\$ '

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
        color_prompt=
    fi
fi

TITLEBAR='\[\e]0;\u@\h\a\]'
# Same thing.. but with octal ASCII escape chars
#TITLEBAR='\[\033]2;\u@\h\007\]'

if [ "$color_prompt" = yes ]; then
    PS1="${TITLEBAR}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\$ "
else
    PS1="${TITLEBAR}\u@\h:\W\$ "
fi
unset color_prompt force_color_prompt

################################################################################
export PATH

# Stop warnings about this settingx
# https://github.com/ansible/ansible/issues/56930
export ANSIBLE_TRANSFORM_INVALID_GROUP_CHARS=ignore

# https://developer.bring.com/blog/configuring-jenv-the-right-way/
# On Cygwin, this causes a 3 second delay after shell commands complete before the prompt returns
# So, source ~/bin/jenv.sh if/when this is needed
if ! uname -s | grep -s CYGWIN >/dev/null; then
  export PATH="$HOME/.jenv/bin:$PATH"
  eval "$(jenv init -)"
fi
#
# SET JAVA_HOME (for Maven, etc)
#jenv enable-plugin maven
#jenv enable-plugin export
