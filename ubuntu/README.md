
Installation Steps:

################################################################################
# Install Ubuntu
################################################################################

lsb_release -a
```
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 18.04.3 LTS
Release:	18.04
Codename:	bionic
```

################################################################################
# SYMLINK COMPUTER-SETUP
################################################################################

# Get code
mkdir -p ~/git/pwyoung && cd $_
git clone https://github.com/pwyoung/computer-setup.git 

# Call ~/.bash_profile
cat << EOF >> ~/.bashrc
if [ -f ~/.bash_profile ]; then
    . ~/.bash_profile
fi
EOF

# Create symlinks
ln -s /home/pyoung/git/pwyoung/computer-setup/generic/home/.bash_profile /home/pyoung/.bash_profile
ln -s /home/pyoung/git/pwyoung/computer-setup/generic/bin /home/pyoung/bin

################################################################################
# TIMESHIFT
################################################################################

# Set up home dir on data drive
- Symlink so it looks like this:
```
ls -ld /home/pyoung
lrwxrwxrwx 1 root root 17 Sep 30 14:30 /home/pyoung -> /data/home/pyoung
```

# Install timeshift
- cat ./timeshift.sh
```
sudo apt -y update
sudo apt -y upgrade
sudo apt -y install make valac libgee-* libvte-* libjson-glib-*
```

# Configure Timeshift
Settings:
- type: rsync
- location: /data drive
- schedule: 3x daily and 3x boot
- users: include all

# Tested timeshift
- took snapshot
- tested restore
- proved:
  - it does not snapshot /data (this is always empty)
  - it DOES snapshot /etc
  - it DOES snapshot /home/<users-specified-in-settings>
- Checks
```
  ls /data/timeshift/snapshots-ondemand/2019-09-30_14-58-26/localhost/home/admin/
  D=$(ls -1tr /data/timeshift/snapshots-ondemand | tail -1) && ls /data/timeshift/snapshots-ondemand/${D}//localhost/home/*
```  

# Timeshift-snapshot: "Added Timeshift"

################################################################################
# PYTHON3
################################################################################

cd ~/git/pwyoung/computer-setup/ubuntu
./python.sh

# Timeshift-snapshot: "Added Python3"

################################################################################
# USB-WIFI
################################################################################

cd ~/git/pwyoung/computer-setup/ubuntu
cat usb-wifi.txt

# Steps
apt-get install rtl8812au-dkms
reboot

# Timeshift-snapshot: "Added usb-wifi"

################################################################################
# Virtualbox
################################################################################

# VB-6
# SPECIFY 64-bit arch!
echo "deb  [arch=amd64] https://download.virtualbox.org/virtualbox/debian $(lsb_release -cs) contrib" \
    | sudo tee /etc/apt/sources.list.d/virtualbox.list

wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -

sudo apt updaet

apt search virtualbox-6
sudo apt install virtualbox-6.0

# Extension Pack
Open the file in the browser which will open it in virtualbox
https://www.virtualbox.org/wiki/Downloads

# Timeshift-snapshot: "Added virtualbox"

################################################################################
# Vagrant
################################################################################

# https://www.vagrantup.com/downloads.html                                                                                                                                                                 
# Get the latest Debian package

# Timeshift-snapshot: "Added virtualbox"

################################################################################
