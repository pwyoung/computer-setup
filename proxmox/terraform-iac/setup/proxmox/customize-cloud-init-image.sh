
#created ext4 storage "local-dir" at /mnt/local-dir

# Create local file (from cloud) at /imgs/
sudo mkdir /imgs
sudo chown $USER.$USER /imgs
cd /imgs
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img

cp ./jammy-server-cloudimg-amd64.img ./jammy-server-cloudimg-amd64.updated.img

# user/pw = root/testpw
virt-customize -a ./jammy-server-cloudimg-amd64.updated.img --root-password password:testpw
