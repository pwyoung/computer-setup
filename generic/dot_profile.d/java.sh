
# Fedora uses this
# ls -l /etc/alternatives/java
# Currently, this is just the JRE for openjdk8
# sudo su - -c 'mv /usr/bin/java /usr/bin/java.MOVED'

# Use jenv if available
if command -v jenv >/dev/null; then
    export PATH="$HOME/.jenv/bin:$PATH"
    eval "$(jenv init -)"
fi

# Hard-code a java version
#export JAVA_HOME=~/.jenv/versions/1.8
#PATH=$JAVA_HOME/bin:$PATH
#
export JAVA_HOME=/opt/java/jdk-13.0.1
export PATH=$PATH:$JAVA_HOME/bin
