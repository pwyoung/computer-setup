# python3
sudo apt install python3-pip
python3 --version

# pip3
pip3 install --upgrade pip
pip3 --version

# venv
sudo apt-get install -y python3-venv
mkdir -p ~/virtualenv && cd $_
if [ ! -e python3 ]; then
    python3 -m venv python3
fi

# Activate the environment on login
mkdir -p ~/.private.d
echo 'source ~/virtualenv/python3/bin/activate' > ~/.private.d/python.sh

source ~/.bash_profile

bash -l -c 'which python&& which pip&& which python3&& which pip3'
bash -l -c 'python --version&& pip --version&& python3 --version&& pip3 --version'
python3 -c 'print("Hello, World!")'
