#!/bin/bash

function set_prompt_linux(){
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	color_prompt=yes
    else
        color_prompt=no
    fi

    if [ "$color_prompt" = yes ]; then
        TITLEBAR='\[\e]0;\u@\h\a\]'
        # Same thing.. but with octal ASCII escape chars
        #TITLEBAR='\[\033]2;\u@\h\007\]'

        PS1="${TITLEBAR}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\$ "
    else
        # PS1="%n@%m %1~ %#"
        PS1="%n %1~ %#"
    fi
}

function set_prompt_mac(){
    # Basic, colorless
    #PS1="%n %1~ %#"

    # Colors
    # https://upload.wikimedia.org/wikipedia/commons/1/15/Xterm_256color_chart.svg

    #PS1="%B%F{33}% %n%f%b %F{153}%~#%f "

    # Like Jetbrains Terminal
    #PS1="%B%F{28}% %n%f%b %F{33}%~#%f "

    #PS1="%B%F{020}% %n%f%b %F{026}%~#%f "
    #PS1="%B%F{020}% %n%f%b %F{026} %~ # "
}

function set_detailed_prompt(){
    orange=$(tput setaf 166);
    yellow=$(tput setaf 228);
    green=$(tput setaf 71);
    white=$(tput setaf 15);
    bold=$(tput bold);
    reset=$(tput sgr0);
    PS1="\[${bold}\]";
    PS1+="\[${orange}\]\u"; # username
    PS1+="\[${white}\]@";
    PS1+="\[${yellow}\]\h "; # host
    PS1+="\[${green}\]\w"; # working directory
    PS1+="\[${white}\]\$ \[${reset}\]"; # '$' (and reset color)
    export PS1;
}

if uname -a | grep -i darwin; then
    set_prompt_mac
    #set_detailed_prompt
else
    set_prompt_linux
fi
