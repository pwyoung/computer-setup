#!/bin/bash

#L=~/mac-setup.log
#echo "Running $0" | tee $L

F=~/.custom-mouse-scaling.txt

# This is needed for slow mice since the GUI won't let me speed
# the mouse up beyond "3"
SCALE_FACTOR="9.0" 

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

# Left for documentation purposes
function setup_mac_prompt() {
    #  https://medium.com/macoclock/how-to-change-the-colour-of-your-bash-prompt-on-mac-b06032543353
    #  oldprompt=$PS1 && echo $oldprompt
    #           %n@%m %1~ %#
    #
    # Ubuntu colors
    #export PS1="%B%F{208}% %n%f%b %F{158}%~:%f "
    #
    # https://upload.wikimedia.org/wikipedia/commons/1/15/Xterm_256color_chart.svg
    #export PS1="%B%F{33}% %n%f%b %F{153}%~#%f "
    # Match Jetbrains Terminal
    #export PS1="%B%F{28}% %n%f%b %F{33}%~#%f "
    echo "no effect. Put this in ~/.zshrc" >/dev/null
}

function setup_mouse_scaling_speed() {
    # Set the mouse scaling. This can exceed the values the GUI supports.
    defaults write .GlobalPreferences com.apple.mouse.scaling -1
    defaults write -g com.apple.mouse.scaling $SCALE_FACTOR
    # Store the values
    defaults read -g com.apple.mouse.scaling >> $F
}

if uname | grep Darwin >/dev/null; then

    echo "$(date)" > $F

    setup_mouse_scaling_speed

    # "open" does not work on html files properly
    alias o='open -a "/Applications/Google Chrome.app"'

    setup_mac_openjdk

    setup_mac_prompt

    # snafu...
    alias scp='noglob scp'

fi
