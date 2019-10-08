################################################################################
# Set up FQDN on host
################################################################################
# Use domainname "local"
/etc/hosts
/etc/hostname

reboot

################################################################################
# Docker
################################################################################
https://docs.docker.com/install/linux/docker-ce/ubuntu/

################################################################################
# Guacamole
################################################################################
cd ...

git clone https://github.com/boschkundendienst/guacamole-docker-compose.git

# Edit prepare.sh
+openssl req -nodes -newkey rsa:2048 -new -x509 -keyout nginx/ssl/self-ssl.key -out nginx/ssl/self.cert -subj '/C=US/ST=MA/L=SomeLocation/O=SomeOrg/OU=SomeOrgUnit/CN=sufil-linux.local/emailAddress=docker@sufil-linux.local'

# Create SSL files and DB init scipt
./prepare.sh

# Start
cd ./guacamole-docker-compose/
docker-compose up -d

# Login in as guacadmin/guacadmin
# Add new "admin" user. pw=Guacamole(8)!
# Disable guacadmin user
# Add normal user

################################################################################
# VNC Server
################################################################################
sudo apt install tigervnc-standalone-server tigervnc-xorg-extension tigervnc-viewer

