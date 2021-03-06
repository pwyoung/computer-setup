#!/bin/bash

# Common setup
if [ -e ~/.profile.d ]; then
    SCRIPTS=$(ls -1 ~/.profile.d/*.sh 2>/dev/null)
fi
for i in $SCRIPTS; do
    #echo "Running $i"
    #source $i # Does not work in DASH. "." is strictly more portable.
    #. $i
    . $i &>/dev/null
done

# Private/Sensitive and custom config
if [ -e ~/.private.d ]; then
    PWSCRIPTS=$(ls -1 ~/.private.d/*.sh 2>/dev/null)
fi
for i in $PWSCRIPTS; do
    . $i &>/dev/null
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
#
#
#
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
#PATH=~/sbt/bin:$PATH

################################################################################
# JAVA
################################################################################

# JENV: manage multiple Java versions and update JAVA_HOME automatically
#   Site:
#     https://github.com/jenv/jenv
#   Proper Setup:
#     Run these commands ONCE so that jenv will manage JAVA_HOME (e.g. for Maven)
#       jenv enable-plugin maven
#       jenv enable-plugin export
#

# Without JENV, just symlink to java
# ln -s /usr/lib/jvm/java-11-openjdk-amd64 /java
JAVA_DIRS=("/java")
for i in "${JAVA_DIRS[@]}"; do
    #echo "Checking $i"
    #ls -ld "$i"
    if [ -e "$i" ]; then
	#echo "Found java at $i"
	export JAVA_HOME="$i"
	break
    fi
done

# If JENV exists and JAVA_HOME is not set, then use JENV
if command -v jenv; then
    if [ -z "$JAVA_HOME" ]; then
	export PATH="$HOME/.jenv/bin:$PATH"
	eval "$(jenv init -)"
	echo "Using jenv."
    fi
fi

if [ ! -z "$JAVA_HOME" ]; then
    echo "JAVA_HOME is $JAVA_HOME"
    PATH=$JAVA_HOME/bin:$PATH
fi

################################################################################
# MAVEN
################################################################################

MAVEN_DIRS=("/opt/apache-maven-3.6.3")
for i in "${MAVEN_DIRS[@]}"; do
    #echo "Checking $i"
    if [ -d "$i" ]; then
	#echo "Found maven at $i"
	export MAVEN_HOME="$i"
	break
    fi
done


if [ ! -z "$MAVEN_HOME" ]; then
    echo "MAVEN_HOME is $MAVEN_HOME"
    PATH=$MAVEN_HOME/bin:$PATH
fi




################################################################################
# SPARK SETUP
################################################################################
# RESOURCES
#   https://medium.com/big-data-engineering/how-to-install-apache-spark-2-x-in-your-pc-e2047246ffc3

# Test
# cd $SPARK_HOME
#   Cygwin:
#     ./bin/run-example.cmd SparkPi 10
#   Ubuntu
#     ./bin/run-example SparkPi 10

# ln -s /c/spark-2.4.5-bin-hadoop2.7 /spark
# Also, this avoids having spaces in path names (e.g. on Cygwin)
if [ -d /spark ]; then
    export SPARK_HOME=/spark
fi
if [ ! -z "$SPARK_HOME" ]; then
    echo "SPARK_HOME is $SPARK_HOME"
    PATH=$SPARK_HOME/bin:$PATH
fi

# Spark on windows wants HADOOP_HOME set
D1="C:\winutils"
D2=/c/winutils
if [ -d $D1 ]; then
    export HADOOP_HOME=$D1
elif [ -d $D2 ]; then
    export HADOOP_HOME=$D2
fi
if [ ! -z "$HADOOP_HOME" ]; then
    echo "HADOOP_HOME is $HADOOP_HOME"
    PATH=$PATH:$HADOOP_HOME/bin
fi

################################################################################
# KAFKA
################################################################################
if [ -d /kafka ]; then
    export KAFKA_HOME=/kafka
fi
if [ ! -z "$KAFKA_HOME" ]; then
    echo "KAFKA_HOME is $KAFKA_HOME"
    PATH=$KAFKA_HOME/bin:$PATH
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
# Cygwin color
################################################################################
#if uname -a | grep -i cygwin 2>/dev/null; then
    #export TERM=cygwin # This hoses emacs and everything BUT makes "mvn build"
    #have the correct colors under cygwin shell (in or outside windows terminal)
#    echo "Cygwin"
#fi

################################################################################
# EXPORT THESE AT THE END
################################################################################
export PATH

# Stop warnings about this settingx
# https://github.com/ansible/ansible/issues/56930
export ANSIBLE_TRANSFORM_INVALID_GROUP_CHARS=ignore
