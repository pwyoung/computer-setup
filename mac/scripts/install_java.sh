#!/bin/sh

# NOTE: As of 3/8/18, We must not install Java-9 because it will break
# the Citrix-VDI app. I have not tried to get VDI to work while Java9 is installed.
# If/when someone does, feel free to install java9.

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

configure_jenv() {
    cat <<'EOF' > ~/.profile.d/jenv.sh
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
EOF
    
    # Add java environments
    for i in `ls -1d /Library/Java/JavaVirtualMachines/*/Contents/Home`; do
	echo "Adding JAVA_HOME at $i"
	yes | jenv add $i
    done

    # Show installed versions
    jenv versions

    # The world is still on Java 8
    jenv global 1.8

    # Configure per dir, like pyenv
    #cd /tmp && jenv local 1.8 & java -version
}

check_default_java() {
    source ~/.bash_profile
    jenv versions    
    if ! java -version 2>&1 | grep '1.8' >/dev/null; then
	echo "It doesn't look like Java 8 was installed properly"
	java -version	
	exit 1
    fi
}

add_helper_scripts() {    
    F=~/bin/j8
    if [ ! -f $F ]; then
	cat <<'EOF' >$F
#!/bin/sh
# GOAL: set 'java' to java 8, for the current shell

# Pre-JENV way
#export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)
#echo "JAVA_HOME=$JAVA_HOME"

# JENV
eval "$(jenv init -)"
jenv shell 1.8
# jenv means never having to say JAVA_HOME 
# It UNSETS JAVA_HOME, and so, relies on apps to set JAVA_HOME relative to the java executable

java -version
EOF
    fi
    chmod 700 $F    
}

brew_update
brew_install "jenv"
brew_cask_install "java8" 
configure_jenv
brew_install "maven" 
check_default_java
add_helper_scripts
