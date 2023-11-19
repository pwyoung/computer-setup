# Resources
#   https://ubuntuforums.org/showthread.php?t=2361347
#   https://unix.stackexchange.com/questions/332886/how-to-get-see-error-message-in-journald

# For awus036ach ac1200 wireless adapter
#
# Make sure it's not installed.
# Turning the wifi off required reinstallation
sudo apt-get remove rtl8812au-dkms || true
#
sudo apt-get update && \
    sudo apt-get install rtl8812au-dkms


echo "Show commands with previous results"
dkms status
cat <<EOF 
OLD RESULT
rtl8812au, 4.3.8.12175.20140902+dfsg, 5.0.0-29-generic, x86_64: installed
virtualbox, 5.2.32, 5.0.0-29-generic, x86_64: installed
EOF

modinfo 8812au | egrep 'filename|vermagic'
cat <<EOF
OLD RESULT
filename:       /lib/modules/5.0.0-29-generic/updates/dkms/8812au.ko
vermagic:       5.0.0-29-generic SMP mod_unload 
EOF


#sudo dkms remove -m rtl8812au -v 4.3.8.12175.20140902+dfsg -k $(uname -r)

# Show errors
#journalctl -p 3 -xb
