#!/bin/sh

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

setup_gnu_tools() {
    brew_install coreutils

    # Putting this export in the normal login path seems to, maybe, cause instabilities
    #export PATH="$(brew --prefix coreutils)/libexec/gnubin:/usr/local/bin:$PATH"
    # So just use gFOO or "gnu FOO" as described below

    # this should work (gnu ls)
    gls -ltr / | tail -1
    
    # this should work too (gnu ls)
    F=~/bin/gnu
    if [ ! -f $F ]; then
        cat <<'EOF' > $F
#!/bin/sh   	    
/usr/local/opt/coreutils/libexec/gnubin/$@
EOF
    fi
    chmod 700 $F	      							
    gnu ls -ltr / | tail -1
}

setup_brew_curl() {
    brew_install curl

    F=~/bin/curl
    if [ ! -f $F ]; then
        cat <<'EOF' > $F
#!/bin/sh   	    
/usr/local/opt/curl/bin/curl $@
EOF
    fi
    chmod 700 $F	      							
}

setup_gnu_tar() {
    # Change the default tar to GNU tar (assuming /usr/local/bin is first in PATH)
    brew install gnu-tar --with-default-names
}

setup_gnu_tools
setup_brew_curl
setup_gnu_tar
