#!/bin/bash

################################################################################
# Permanent/Public scipts (that's ok to put in git)
################################################################################

# Public stuff to add to PATH
if [ -e ~/bin ]; then
    PATH=~/bin:$PATH
fi

# Public setup scripts
if [ -e ~/.profile.d ]; then
    SCRIPTS=$(ls -1 ~/.profile.d/*.sh 2>/dev/null)
fi
for i in $SCRIPTS; do
    . $i &>/dev/null
done

################################################################################
# Private/Sensitive/Ephemeral custom stuff (not in git)
################################################################################

# Private stuff to add to PATH
if [ -e ~/bin-local ]; then
    PATH=~/bin-local:$PATH
fi

# Private setup scripts (e.g. things installers add to shell startup scripts like ~/.bashrc)
if [ -e ~/.private.d ]; then
    PWSCRIPTS=$(ls -1 ~/.private.d/*.sh 2>/dev/null)
fi
for i in $PWSCRIPTS; do
    . $i &>/dev/null
done

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

# JENV: manage multiple Java versions and update JAVA_HOME automatically
#   Site:
#     https://github.com/jenv/jenv
#   Proper Setup:
#     Run these commands ONCE so that jenv will manage JAVA_HOME (e.g. for Maven)
#       jenv enable-plugin maven
#       jenv enable-plugin export
#
#
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
# Manage Java installations
################################################################################

# JABBA [do not use this, read below for reasons]
#
# https://github.com/shyiko/jabba#installation
# jabba ls-remote | less
# jabba install openjdk@1.11.0-2 /home/pwyoung/.jabba/jdk/openjdk@1.11.0-2
# jabba install openjdk@1.15.0-2
#
# SNAFU: This bugfix release is 14 days old and not available via jabba yet...
# https://github.com/graalvm/graalvm-ce-builds/releases/tag/vm-21.0.0.2
# Also, other versions are old...
# Forget jabba...
# rm -rf ~/.jabba

# SDKMAN [USE THIS] ***
# https://sdkman.io/
#
# NOTES:
#   To use "as-needed" (for installing only), just run:
#     curl -s "https://get.sdkman.io" | bash
#     source "/home/pwyoung/.sdkman/bin/sdkman-init.sh"
#
# sdk list java
# sdk install java 21.0.0.2.r11-grl
#
# HOTSPOT vs Open
# https://www.royvanrijn.com/blog/2018/05/openj9-jvm-shootout/
# sdk install java 15.0.2.hs-adpt
# sdk install java 15.0.2.j9-adpt
# sdk install java 11.0.10.j9-adpt
# sdk install java 11.0.10.hs-adpt
#
#ls -l ~/.sdkman/candidates/java/
#total 20
#drwxr-xr-x  9 pwyoung pwyoung 4096 Jan 20 07:19 11.0.10.hs-adpt
#drwxr-xr-x  9 pwyoung pwyoung 4096 Jan 20 04:23 11.0.10.j9-adpt
#drwxr-xr-x  9 pwyoung pwyoung 4096 Jan 21 07:13 15.0.2.hs-adpt
#drwxr-xr-x  9 pwyoung pwyoung 4096 Jan 21 03:42 15.0.2.j9-adpt
#drwxrwxr-x 10 pwyoung pwyoung 4096 Feb 26 15:01 21.0.0.2.r11-grl
#lrwxrwxrwx  1 pwyoung pwyoung   15 Feb 26 15:14 current -> 11.0.10.hs-adpt


# Let JAVA_HOME be /java per above (to avoid jenv etc)
# sudo ln -s ~/.sdkman/candidates/java/11.0.10.hs-adpt /java

################################################################################
# MAVEN
################################################################################

#sdk list maven
#pwyoung@tardis:spark$ sdk install maven 3.6.3

MAVEN_DIRS=("/home/pwyoung/.sdkman/candidates/maven/3.6.3/")
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
#   https://spark.apache.org/downloads.html
#   https://medium.com/big-data-engineering/how-to-install-apache-spark-2-x-in-your-pc-e2047246ffc3

# Test
# cd $SPARK_HOME
#   Cygwin:
#     ./bin/run-example.cmd SparkPi 10
#   Ubuntu
#     ./bin/run-example SparkPi 10

# SDKMAN
#   source "/home/pwyoung/.sdkman/bin/sdkman-init.sh"
#   sdk list spark
#   sdk install spark 3.0.2
#   Which hadoop libs does it have (none, 2.x, or 3.x)?


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

# TEST SPARK LOCAL (NATIVE BINARIES)
#   cd /spark
#   time ./bin/spark-submit   --class org.apache.spark.examples.SparkPi   --master local[8]  /spark/examples/jars/spark-examples_2.12-3.0.2.jar   100
#   7.8s
#
# TEST SPARK LOCAL (ON DOCKER)
#   git clone https://github.com/big-data-europe/docker-spark.git
#   docker-compose up
#   time ./bin/spark-submit   --class org.apache.spark.examples.SparkPi   --master spark://localhost:7077 /spark/examples/jars/spark-examples_2.12-3.0.2.jar   100
#   9.7s

# Spark History (requires an optional service and for apps to specify the log dir)
#   https://spark.apache.org/docs/latest/monitoring.html
#   https://www.back2code.me/2018/11/spark-history-server-available-in-docker-spark/

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

#[ -s "/home/pwyoung/.jabba/jabba.sh" ] && source "/home/pwyoung/.jabba/jabba.sh"

# Rust (todo. move to ~/.profile.d/rust.sh if possible. test since maybe this failed b4)
if [ -d $HOME/.cargo ]; then
    . "$HOME/.cargo/env"
fi


