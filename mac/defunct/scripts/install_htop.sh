#!/bin/sh
# GOAL: This just records how htop was manually installed
#
# NOTE
#   HTOP is currently broken in homebrew. But it did install manually
#   So, this installs a specific version of htop

show_htop_web_page() {
    URL='http://hisham.hm/htop/releases/'
    open $URL
}
    
install_htop() {
    cd ~/Downloads
    URL='http://hisham.hm/htop/releases/2.0.2/htop-2.0.2.tar.gz'
    curl -o htop.tar.gz $URL
    tar xvzf ./htop.tar.gz
    cd ./htop-2.0.2
    ./configure
    make
    make install
}


test_htop() {
    htop --version
}

################################################################################
# MAIN LOGIC
################################################################################

if htop --version 2&>/dev/null; then
    echo "Htop seems to already be installed"
else
    echo "Installing htop"
    install_htop
fi

test_htop

