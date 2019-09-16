#!/bin/sh

remove_old_homebrew_dirs(){
    dirs='/usr/local/bin/ /usr/local/etc/ /usr/local/include/ /usr/local/lib/ /usr/local/sbin/ /usr/local/share/ /usr/local/var/ /usr/local/Homebrew'
    dirs=" ${dirs} ~/Library/Caches/Homebrew ~/Library/Logs/Homebrew"
    dirs=" ${dirs} /opt/homebrew-cask /usr/local/Caskroom"

    echo "dirs=$dirs"
    for i in $dirs; do
	if [ -e $i ]; then
	    echo "Removing dir, $i"
	    #ls -l $i
	    #sudo mv -f $i $ARCHIVE/
            rm -rf $i
	fi
    done
}

uninstall_homebrew() {
    if brew doctor > /dev/null; then
	echo "Uninstalling Homebrew."
	/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall)"
    else
	echo "Brew does not appear to be installed. Skipping uninstallation step"
    fi
    remove_old_homebrew_dirs    	
}


uninstall_homebrew
