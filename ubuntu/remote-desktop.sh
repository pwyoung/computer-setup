################################################################################
# VNC Server
################################################################################
sudo apt install tigervnc-standalone-server tigervnc-xorg-extension tigervnc-viewer

vncpasswd

cat <<EOF > ~/.vnc/xstartup
#!/bin/sh
# Start Gnome 3 Desktop 
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
vncconfig -iconic &
dbus-launch --exit-with-session gnome-session &
EOF

# Test connection (locally)
# There was an xserver running, so this is on ":2"
xtigervncviewer -SecurityTypes VncAuth -passwd /home/pyoung/.vnc/passwd :2
# Enter password (sent cleartext)
xtigervncviewer -SecurityTypes VncAuth :2

################################################################################
# RDP SERVER
################################################################################

sudo apt -y install freerdp2-shadow-x11 | tee ~/freerdp.install.txt

Did not work. Docs are limited. Skipping this for now.

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

# Connections from remote machines must use the IP of the target machine
# (until/unless I set up SSL and DNS better...)

