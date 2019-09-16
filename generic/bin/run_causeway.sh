#!/bin/sh

err_report() {
    echo "Error on line $1"
}
trap 'err_report $LINENO' ERR


# Check KUBECONFIG
env | grep KUBE | grep '.kube/config' | grep '.kube/cpp'

# Add route if necessary
if ! netstat -nr | grep '192.0.2.128/25' | grep '192.0.2.2' | grep vboxnet >/dev/null; then
    sudo route add 192.0.2.128/25 192.0.2.2 || true
fi
# Check Route existence
netstat -nr | grep '192.0.2.128/25' | grep '192.0.2.2' | grep vboxnet
#
#
# For debugging
#netstat -nr | grep 192
#10.0.0.1           0:24:b2:57:28:b4   UHLWIir        31    31585     en0   1192
#192.0.2/25         link#18            UC              2        0 vboxnet
#192.0.2.127        ff:ff:ff:ff:ff:ff  UHLWbI          0        1 vboxnet
#192.0.2.128/25     192.0.2.2          UGSc            0        0     en0    <----- ROUTE
#192.254.2/25       link#19            UC              2        0 vboxnet    <--- Other Virtualbox routes
#192.254.2.127      ff:ff:ff:ff:ff:ff  UHLWbI          0        1 vboxnet
#
# Not needed as of pr-23
# Check symlink/path to code
#ls -ld ~/git/Causeway-Platform-Proxy/
#
# Remove helm dir
rm -rf ~/.helm
#
# Log out of docker
docker logout || true
#
# Clean up previous vagrant run
#cd ~/git/Causeway-Platform-Proxy/vagrant # PR-23 does not need symlink
cd /repos/pyoung/Causeway-Platform-Proxy/vagrant
vagrant destroy -f
rm -rf ./.vagrant
#
# RUN IT
time vagrant up

