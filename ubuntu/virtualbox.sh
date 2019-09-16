
# This give v5.x
#sudo apt-get install virtualbox
#sudo apt-get install virtualbox-ext-pack


################################################################################
# Add the latest VirtualBox
################################################################################
# https://linuxhint.com/install_virtualbox_6_ubuntu/

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

