sudo apt-get update
sudo apt-get install build-essential libffi-dev libssl-dev libbz2-dev libreadline-dev libsqlite3-dev
curl -L https://raw.githubusercontent.com/pyenv/pyenv-installer/master/bin/pyenv-installer | bash
sudo apt install pyenv
# Configure pyenv for this user
cat <<EOF >> ~/.bash_profile
# PYENV
export PATH="/home/pyoung/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
EOF
# Install Python 3 for this user
pyenv install 3.7.4
