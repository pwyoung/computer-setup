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
