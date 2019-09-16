#!/bin/sh
# GOAL: This installs Docker on a Mac, using the DMG at the URL specified below

MY_PATH=$( cd $(dirname "$0") && pwd )

################################################################################
# VARIABLES
################################################################################

#Docker Community Edition 17.09.0-ce-mac35 2017-10-06 (Stable)
DMG_URL='https://download.docker.com/mac/stable/19611/Docker.dmg'

#INSTALLATION_METHOD='DMG'
INSTALLATION_METHOD='HOMEBREW'

################################################################################

DOCKER_DMG=~/Downloads/Docker.dmg # F
DOCKER_VOL_DIR=/Volumes/Docker # D

get_dmg(){
    F=$DOCKER_DMG
    if [ -f $F ]; then
	echo "$F already exists"
    else
	curl $DMG_URL > $F
    fi
}

attach_dmg(){
    F=$DOCKER_DMG    
    D=$DOCKER_VOL_DIR
    if [ -d $D ]; then
	echo "$D already exists"
	ls -l $D
    else
	sudo hdiutil attach $F
    fi
}

install_dmg(){
    D=$DOCKER_VOL_DIR    
    APP=$(ls -1d $D/*.app)
    if ls -1 $APP >/dev/null; then
	echo "Moving $APP to /Applications"
	sudo cp -r $APP /Applications/
    else
	echo "Did not find app"
    fi

    ls -ltr /Applications | tail -1
}

detach_dmg(){
    D=$DOCKER_VOL_DIR    
    if [ -d $D ]; then
	sudo hdiutil detach $D
    else
	echo "$D does not exist"
    fi
}


install_docker_via_dmg() {    
    get_dmg
    attach_dmg
    install_dmg
    detach_dmg

    # The DMG installer does not create an executable in PATH
    # The brew installer puts it in /usr/local/bin
    LOG=~/docker.log
    F=~/bin/docker
    cat <<EOF > $F
/Applications/Docker.app/Contents/MacOS/Docker > $LOG 2>1 &
EOF
    chmod +x $F

    create_bash_completion_symlinks    
}

install_docker_via_homebrew() {
    #brew install docker

    brew cask install docker 

    #brew install bash-completion
    #brew install docker-completion
    #brew install docker-compose-completion
    #brew install docker-machine-completion

}

install_docker() {
    if ls /Applications/Docker.app >/dev/null; then
	echo "Docker appears to already be installed"
    else
	if [ "$INSTALLATION_METHOD" = 'DMG' ]; then
	    echo "Installing Docker from DMG at $DMG_URL"
	    install_docker_via_dmg
	else
	    echo "Installing Docker via Homebrew"
	    install_docker_via_homebrew
	fi
    fi

    # Unset variables which might be set to redirect "docker" CLI commands (e.g. to minikube)
    unset DOCKER_HOST
    unset DOCKER_TLS_VERIFY
    unset DOCKER_CERT_PATH
}

# Do this before downgrading
nuke_docker() {
    echo "This will destroy Docker"
    echo "Kill the App in the task bar, and hit enter to continue."
    read OK
    
    D=/Applications/Docker.app
    if [ -d $D ]; then
	sudo rm -rf $D
    fi
    
    if [ -f $DOCKER_DMG ]; then
	rm $DOCKER_DMG
    fi

    if [ -d $DOCKER_VOL_DIR ]; then
	umount $DOCKER_VOL_DIR
	rm -rf $DOCKER_VOL_DIR
    fi
    
    if brew list docker >/dev/null 2>&1; then
	brew uninstall docker
    fi
    
    for F in /usr/local/bin/docker /usr/local/bin/docker-compose /usr/local/bin/docker-credential-osxkeychain /usr/local/bin/docker-machine /usr/local/bin/docker-machine-driver-hyperkit /usr/local/etc/bash_completion.d/docker /usr/local/share/fish/vendor_completions.d/docker.fish /usr/local/share/zsh/site-functions/_docker; do
	if [ -f $F ]; then
	    rm $F
	fi
    done

    F=/var/run/docker.sock
    if [ -f $F ]; then
	sudo rm $F
    fi

    
    D=~/.docker
    if [ -d $D ]; then
	rm -rf $D
    fi    
}

################################################################################

run_docker(){
    echo "Invoking the GUI for Docker. Make sure you see the GUI..." 
    open -a /Applications/Docker.app    
    echo "Once the Docker GUI shows it is 'Docker is now up and running', hit enter to continue"
    read -p HIT_ENTER
}

check_versions() {
  echo "Versions"
  docker --version
  docker-compose --version
  docker-machine --version
}

test_docker_with_nginx() {
  docker run -d -p 80:80 --name webserver nginx

  sleep 3
  
  # Return error if nginx doesn't show its welcome screen
  curl http://localhost | grep 'Welcome to nginx'
  if [ $? == 0 ]; then
      echo "Docker test of nginx succeeded. Hit enter to continue"
      read -p HIT_ENTER          
  else
      echo "Docker test of nginx failed"
      exit 1
  fi

  # Show docker containers 
  docker ps

  # Stop and remove the running container "webserver" (but keep the image)
  docker rm -f webserver

  # Remove the image
  #  docker rmi <imageID>|<imageName>.
  # Keep it... why not?
  # docker rmi webserver
}

test_docker(){
    echo "Testing Docker: with 'docker version'"    
    docker version
    echo "Testing Docker: with 'docker ps -a'"
    docker ps -a

    test_docker_with_nginx    
}

symlink(){
    DEST="$1"
    SRC="$2"
    if [ -f ${SRC} ]; then
	#echo "$SRC already exists. Exiting"
	return
    else
	ln -s ${DEST} ${SRC}
    fi
}

create_bash_completion_symlinks(){
    echo "Creating bash completion symlinks per https://docs.docker.com/docker-for-mac/"

    if which brew >/dev/null; then
	brew install bash-completion
    else
	echo "Homebrew seems to not be installed. Exiting"
	exit 1
    fi
    
    SRC=/usr/local/etc/bash_completion.d/docker
    DEST=/Applications/Docker.app/Contents/Resources/etc/docker.bash-completion 
    symlink "${DEST}" "${SRC}"
    
    SRC=/usr/local/etc/bash_completion.d/docker-machine
    DEST=/Applications/Docker.app/Contents/Resources/etc/docker-machine.bash-completion
    symlink "${DEST}" "${SRC}"    
    
    SRC=/usr/local/etc/bash_completion.d/docker-compose
    DEST=/Applications/Docker.app/Contents/Resources/etc/docker-compose.bash-completion
    symlink "${DEST}" "${SRC}"    
}


configure_docker_settings() {
    MAC_NCPU=$(sysctl hw.ncpu |  perl -pe 's/hw.ncpu: (.*)/$1/')
    MAC_MEM_GB=$(echo `sysctl hw.memsize | cut -d':' -f 2`" /1024/1024/1024" | bc)
    
    DOCKER_MEM_GB=$(docker info | grep 'Total Memory' | perl -pe 's/Total Memory: (.*) GiB/$1/')
    DOCKER_NCPU=$(docker info | grep CPUs |  perl -pe 's/CPUs: (.*)/$1/')
        
    cat <<EOF
    Docker needs to be configured via the GUI.

    You probably want to:
      - "Start Docker when you log in"
      - "Automatically check for updates"
      - "Securely store docker logins in macOS keychain"

    If using Time machine, you may want to unselect:
      "Include VM in Time Machine backups"

    FILE SHARING
      Docker will fail to start containers that try to access a
      shared storage volume that is not under a directory listed in docker's
      File-Sharing settings. The error will be:
      "Error response from daemon: Mounts denied: -> Preferences... -> File Sharing."
      So, open Docker->Preferences->FileSharing and add the path (e.g. /repos).

    MEMORY
      Docker has ${DOCKER_MEM_GB} GB of the machine's ${MAC_MEM_GB} GB RAM

    CPU
      Docker has ${DOCKER_NCPU} of the machine's ${MAC_NCPU} CPUs

    When done, hit enter.
EOF
    read -p HIT_ENTER    
}

install_local_docker_registry() {
    # https://docs.docker.com/registry/deploying/
    if docker ps -a | grep registry >/dev/null; then
	echo "registry is installed"
	if docker ps | grep registry >/dev/null; then
	    echo "registry is running"
	else
	    docker start registry
	fi
    else
	mkdir -p ~/registry
	docker run -d -p 5000:5000 --restart=always --name registry -v ~/registry:/var/lib/registry registry:2
    fi
}

update_path() {
    D=~/.profile.d
    if [ ! -f $D ]; then
        mkdir -p $D
    fi    
    F=~/.profile.d/docker.sh
    if [ ! -f $F ]; then
	cat <<'EOF'
PATH=$PATH:/usr/local/Homebrew/Library/Taps/homebrew/homebrew-core/Aliases
EOF
        echo "Source $F to add docker to your PATH"
    fi
}

################################################################################
# MAIN LOGIC
################################################################################

# Exit if the registry is already running
if which docker >/dev/null; then
    if docker ps | perl -pe 's/.* (.*?)/$1/' | grep registry >/dev/null; then
        echo "Looks like you have a local registry running already. Exiting"
        exit 0
    fi
fi

# Do this before downgrading
#nuke_docker

install_docker
run_docker
configure_docker_settings
check_versions
test_docker
install_local_docker_registry
update_path
