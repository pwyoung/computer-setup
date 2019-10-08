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
# https://manpages.debian.org/stretch-backports/freerdp2-shadow-x11/freerdp-shadow-cli.1.en.html
# https://github.com/FreeRDP/FreeRDP/issues/4903

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

################################################################################
# Install from source
#   https://guacamole.apache.org/doc/0.9.0/gug/installing-guacamole.html#compiling-guacamole-server
# Can't install from PPA, none for Disco
#   http://ppa.launchpad.net/guacamole/stable/ubuntu/dists/


git clone git://github.com/glyptodon/guacamole-server.git
git fetch --tags
git checkout -b build-me glyptodon/1.11
cd guacamole-server
sudo apt install autoconf libtool
autoreconf -fi

# DEPS
#https://guacamole.apache.org/doc/gug/installing-guacamole.html
sudo apt install libpng++ libpng++-dev libjpeg-turbo8-dev libcairo2-dev libossp-uuid-dev

# VNC
sudo apt install libvncserver-dev

# NOT ON ubuntu19
#
# FFMPG
#libavcodec-dev, libavutil-dev, libswscale-dev
#
# RDP
#sudo apt install freerdp2-dev
#sudo apt installfreerdp2-x11
# There is no libfreerdp-core package...FreeRDP is v2 on ubuntu19...
# REMOVE AND INSTALL FREERDP FROM SRC
#sudo apt remove $(apt list --installed 2>/dev/null | grep freerdp | cut -d'/' -f 1)
#
# BUILD FREERDP - Fails
#    https://github.com/awakecoding/FreeRDP-Manuals/blob/master/Developer/FreeRDP-Developer-Manual.markdown
cd /home/pyoung/git/third-party/FreeRDP
sudo apt install -y libcups2-dev libclalsadrv-dev libxcb-xkb-dev libxkbcommon-dev libxkbcommon-x11-dev libxkbfile-dev
sudo apt install -y libxinerama-dev libxcursor-dev libxv-dev
cmake .


sudo apt install libpango1.0-dev libssh2-1-dev
sudo apt install libpulse-dev
sudo apt install libwebp-dev
sudo apt install libogg-dev libvorbis-dev libvorbisidec-dev
sudo apt install libtelnet-dev
sudo apt install libavcodec-dev libavutil-dev libswscale-dev



configure




