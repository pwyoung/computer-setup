#!/bin/sh

# Install Homebrew

add_usr_local_sbin_to_path(){
    echo "Adding /usr/local/sbin to PATH"
    FILE=~/.bash_profile
    LINE='export PATH=/usr/local/sbin:$PATH'    
    if cat $FILE | grep 'PATH=/usr/local/sbin' >/dev/null; then
	echo "File $FILE already contains 'PATH=/usr/local/sbin'"
    else
	echo $LINE >> $FILE
    fi
}    

run_brew_doctor() {
	echo "Running 'brew doctor'. Make sure to make the changes it recommends and then hit enter"
	brew doctor 
	read -p "Hit enter when done"
}

install_homebrew() {    
    if brew --version; then
	echo "Homebew is already installed"
	run_brew_doctor
    else
	echo "Installing Homebrew files. NOTE: DO NOT install Homebrew as root"
	ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"	
    fi    
}

update_homebrew(){

    brew update
    brew upgrade

    KEGS_TO_LINK=$((brew doctor 2>&1) | grep '^ ' | grep -v 'brew install')
    if [ ${#KEGS_TO_LINK} -gt 0 ]; then
	brew link ${KEGS_TO_LINK}
    fi
    
    F=~/brew_install.sh
    (brew doctor 2>&1) | grep '^ ' | grep 'brew install' > $F
    sh $F
    rm $F
  
    brew prune    
    
    run_brew_doctor
}

install_cask() {
    brew tap caskroom/cask
    brew install brew-cask-completion
}

install_homebrew
update_homebrew
add_usr_local_sbin_to_path
install_cask

