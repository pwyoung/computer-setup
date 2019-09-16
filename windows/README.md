# Setup
- Ubuntu
  - Git
  - OpenSSH Client
  - OpenSSH Server

# Details

## OpenSSH Client
ssh-keygen -t rsa

## OpenSSH Server
sudo service ssh --full-restart
cp ./id_rsa.pub authorized_keys
chmod 600 ./authorized_keys
ssh localhost
Copy keys from other host
ssh from other host
