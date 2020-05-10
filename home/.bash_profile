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


# SBT
PATH=~/sbt/bin:$PATH



# JENV: manage multiple Java versions and update JAVA_HOME automatically
#   Site:
#     https://github.com/jenv/jenv
#   Proper Setup:
#     Run these commands ONCE so that jenv will manage JAVA_HOME (e.g. for Maven)
#       jenv enable-plugin maven
#       jenv enable-plugin export
#
#
# Allow force-setting the Java version to /java if it exists.
# Also, this avoids having spaces in path names (e.g. on Cygwin)
#if [ -e /usr/lib/jvm/java-8-openjdk-amd64 ]; then
    
if [ -e /java ]; then
    export JAVA_HOME=/java
else
  if uname -s | grep -s CYGWIN >/dev/null; then
    # DO NOT USE JENV ON CYGWIN (by default anyway)
    # On Cygwin, this causes a 3 second delay after shell commands complete before the prompt returns.
    # So, source ~/bin/jenv.sh to invoke jenv if/when it is needed
    if [ -z "$JAVA_HOME" ]; then
      JB="$(which java)"
      if [ ! -z "$JB" ]; then
        export JAVA_HOME=$(dirname "$JB")
      fi
    fi
  else
    export PATH="$HOME/.jenv/bin:$PATH"
    eval "$(jenv init -)"
  fi
fi
echo "JAVA_HOME is $JAVA_HOME"


################################################################################
# HADOOP IN Docker
################################################################################
D=/c/cygwin64/home/youngp/hadoop-3.1.3
if [ -d $D ]; then
    export HADOOP_HOME=$D
    PATH=$PATH:$HADOOP_HOME/bin
fi

################################################################################
# SPARK SETUP
################################################################################
# RESOURCES
#   https://medium.com/big-data-engineering/how-to-install-apache-spark-2-x-in-your-pc-e2047246ffc3

# ln -s /c/spark-2.4.5-bin-hadoop2.7 /spark
# Also, this avoids having spaces in path names (e.g. on Cygwin)
if [ -d /spark ]; then
    export SPARK_HOME=/spark
    PATH=$SPARK_HOME:$PATH
fi

if [ -f $SPARK_HOME/bin/winutils.exe ]; then
    export HADOOP_HOME=$SPARK_HOME
fi


################################################################################
# WINDOWS PYTHON
################################################################################

D=/cygdrive/c/Users/youngp/AppData/Local/Programs/Python/Python38-32/Scripts
if [ -e $D ]; then
    PATH=$D:$PATH
fi
D=/cygdrive/c/Users/youngp/AppData/Local/Programs/Python/Python38-32
if [ -e $D ]; then
    PATH=$D:$PATH
fi

# Test Python
#  python --version

# Test Pip
#  pip --version

# Cygwin confirms
# Test Pip
#  pip --version
# which python
# which pip

################################################################################
# EXPORT THESE AT THE END
################################################################################
export PATH

# Stop warnings about this settingx
# https://github.com/ansible/ansible/issues/56930
export ANSIBLE_TRANSFORM_INVALID_GROUP_CHARS=ignore
