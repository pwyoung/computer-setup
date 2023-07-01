#!/bin/bash


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

# Update PATH for Java
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

