
# https://docs.docker.com/install/linux/docker-ce/ubuntu/

# Purge old version
# apt-get remove docker docker-engine docker.io containerd runc

sudo apt-get update

sudo apt-get install \
     apt-transport-https \
     ca-certificates \
     curl \
     gnupg-agent \
     software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

#sudo apt-key fingerprint 0EBFCD88
        
sudo add-apt-repository \
     "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io

sudo docker run hello-world

# Normal user
sudo gpasswd -a $USER docker
newgrp docker
docker run hello-world

# Docker compose
sudo apt install docker-compose

sudo ls -ld /var/lib/docker
#drwx--x--x 14 root root 4096 Oct  7 20:33 /var/lib/docker
