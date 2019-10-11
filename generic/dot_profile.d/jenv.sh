
if command -v jenv >/dev/null; then
    export PATH="$HOME/.jenv/bin:$PATH"
    eval "$(jenv init -)"
fi

#export JAVA_HOME=~/.jenv/versions/1.8
#PATH=$JAVA_HOME/bin:$PATH
