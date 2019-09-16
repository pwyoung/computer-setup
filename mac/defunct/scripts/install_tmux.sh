#!/bin/sh

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

copy_tmux_config_files(){
    F=~/.tmux.conf
    if [ ! -f $F ]; then
	cp -f ${MY_PATH}/../files/dot_tmux.conf $F
    fi

    D=~/.tmux
    if [ ! -d $D ]; then
	cp -rf ${MY_PATH}/../files/dot_tmux $D
    fi
}

set_aliases(){
F=~/.profile.d/tmux.sh
cat <<'EOF' > $F
# It might be useful to add these lines to your ~/.bash_profile

SESSION="general"
alias tn="tmux new -s '$SESSION'"
alias ta="tmux attach -t '$SESSION'"
alias ts="tmux switch -t '$SESSION'"
alias tk="tmux kill-session -t '$SESSION'"

SESSION="dev"
alias tn_dev="tmux new -s '$SESSION'"
alias ta_dev="tmux attach -t '$SESSION'"
alias ts_dev="tmux switch -t '$SESSION'"
alias tk_dev="tmux kill-session -t $SESSION"
EOF

}

brew_update
brew_install "tmux"
copy_tmux_config_files
set_aliases
