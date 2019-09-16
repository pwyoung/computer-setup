#!/bin/sh

# https://superuser.com/questions/364304/how-do-i-configure-ssh-on-os-x


# https://coderwall.com/p/tgp6zg/osx-ssh-config-hostname-autocompletion
fix_ssh_completion() {
    F=~/.profile.d/ssh_config_tab_completion.sh
    if [ ! -f $F ]; then
	cat <<'EOF' > $F
    complete -o default -o nospace -W "$(/usr/bin/env ruby -ne 'puts $_.split(/[,\s]+/)[1..-1].reject{|host| host.match(/\*|\?/)} if $_.match(/^\s*Host\s+/);' < $HOME/.ssh/config)" scp sftp ssh
EOF
    fi
    chmod 700 $F
    source $F

    # This is nicer, but only for bash it seems
    # http://davidalger.com/development/bash-completion-on-os-x-with-brew/
}

create_ssh_config() {
    F=~/.ssh/config
    if [ ! -f $F ]; then
	cat <<'EOF' >$F
Host *
    # tell_ssh_to_use_keychain
    UseKeychain yes
    AddKeysToAgent yes


# Replace/Copy as needed
Host pico
  HostName 10.1.10.240
  Port 22
  User picocluster
EOF
    echo "Add the key to the keychain now. So, enter the passphrse one more time"
    ssh-add ~/.ssh/id_rsa    	
    fi
    
}

create_default_keypair(){
    F=~/.ssh/id_rsa
    if [ -f $F ]; then
	echo "$F already exists. Not recreating keys."
    else
	echo "Ok, this will generate a new ssh keypair, get ready to think of a good passphrase"
	#ssh-keygen -t rsa -b 4096 -C "comment" -P "passphrase" -f "private_key" -q  # non-interactive
	ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
    fi
    ls -l ~/.ssh/id_rsa*    
}

install_public_key_on_remote_hosts(){
    ssh-copy-id pico
}

allow_ssh_to_this_mac() {

    # Disallow SSH access
    # sudo systemsetup -setremotelogin off
    
    state=$(sudo systemsetup -getremotelogin)
    if [ "$state" == "Remote Login: Off" ]; then
	echo "state=$state"
	sudo systemsetup -f -setremotelogin on
    fi

    echo "This should say remote login is ON"
    sudo systemsetup -getremotelogin

    echo "Allow this user to ssh to this box"
    ssh-copy-id $USER@127.0.0.1

    # Simple test
    ssh $USER@127.0.0.1 "echo testing-test-seems-to-have-worked"    
}


create_default_keypair
create_ssh_config
#install_public_key_on_remote_hosts
fix_ssh_completion
allow_ssh_to_this_mac
