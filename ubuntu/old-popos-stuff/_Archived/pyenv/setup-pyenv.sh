PKGS=build-essential libssl-dev zlib1g-dev libbz2-dev
PKGS+=libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev
PKGS+=xz-utils tk-dev libffi-dev liblzma-dev git
#python-openssl
PKGS+=openssl libssl-dev
#PR?
#sudo apt-get install git python3-pip python-is-python3 make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl libffi-dev

sudo apt-get install -y $PKGS

pip install virtualenvwrapper

git clone https://github.com/pyenv/pyenv.git ~/.pyenv
git clone https://github.com/pyenv/pyenv-virtualenv.git ~/.pyenv/plugins/pyenv-virtualenv
git clone https://github.com/pyenv/pyenv-virtualenvwrapper.git ~/.pyenv/plugins/pyenv-virtualenvwrapper


cat << EOF > ~/Downloads/setup-pyenv.sh
    	export PYENV_ROOT="$HOME/.pyenv"
	export PATH="$PYENV_ROOT/bin:$PATH"
	if command -v pyenv 1>/dev/null 2>&1; then
	  eval "$(pyenv init -)"
	fi
	export PYENV_VIRTUALENVWRAPPER_PREFER_PYENV="true"
	export WORKON_HOME=$HOME/.virtualenvs
	eval "$(pyenv virtualenv-init -)"
	pyenv virtualenvwrapper_lazy
EOF
