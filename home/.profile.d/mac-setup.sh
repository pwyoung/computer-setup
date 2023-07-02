#!/bin/bash

#L=~/mac-setup.log
#echo "Running $0" | tee $L

F=~/.custom-mouse-scaling.txt

# Maybe use "jenv", but skip that for now
function notes() {

    # Java is at /usr/bin/java according to "command -v java"
    # And "/usr/bin/java -version" gives this...
    cat <<EOF > /dev/null
The operation couldn’t be completed. Unable to locate a Java Runtime.
Please visit http://www.java.com for information on installing Java.
EOF

    # "brew install openjdk" gives this...
    cat <<EOF > /dev/null
For the system Java wrappers to find this JDK, symlink it with
  sudo ln -sfn /usr/local/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk

openjdk is keg-only, which means it was not symlinked into /usr/local,
because macOS provides similar software and installing this software in
parallel can cause all kinds of trouble.

If you need to have openjdk first in your PATH, run:
  echo 'export PATH="/usr/local/opt/openjdk/bin:$PATH"' >> ~/.zshrc

For compilers to find openjdk you may need to set:
  export CPPFLAGS="-I/usr/local/opt/openjdk/include"

==> Summary
🍺  /usr/local/Cellar/openjdk/18.0.1.1: 641 files, 307.9MB
==> Running `brew cleanup openjdk`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
EOF

    # sanity check: "env | grep -i java" shows nothing

}

function setup_mac_openjdk() {
    export JAVA_HOME=/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home

    # ~/.bash_profile (linked from ~/.zprofile) will add java to $PATH
    # because JAVA_HOME is set.
    # Skip this if we want to use something like jenv instead

    #export PATH="$JAVA_HOME/bin:$PATH"
}

# If this is a mac, and $F does not exist, then set the mouse sensitivity
if uname | grep Darwin >/dev/null; then

    # Set the mouse scaling. This can exceed the valyes the GUI supports.
    defaults write .GlobalPreferences com.apple.mouse.scaling -1
    defaults write -g com.apple.mouse.scaling 16.0
    defaults read -g com.apple.mouse.scaling > $F

    # "open" does not work on html files properly
    alias browse='open -a "/Applications/Google Chrome.app"'
    alias o='open -a "/Applications/Google Chrome.app"'

    #return
    setup_mac_openjdk

fi


