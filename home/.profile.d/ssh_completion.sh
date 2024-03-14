_ZSH_complete_ssh_hosts ()
{
        COMPREPLY=()
        cur="${COMP_WORDS[COMP_CWORD]}"
        comp_ssh_hosts=`
            awk '{split($1,aliases,","); if (aliases[1] !~ /^\[/) print aliases[1]}' ~/.ssh/known_hosts ;
            awk '/^Host/ && $2 !~ /[*]/ {print $2}' ~/.ssh/config ;
            `
        COMPREPLY=( $(compgen -W "${comp_ssh_hosts}" -- $cur))
        return 0
}

_complete_ssh_hosts ()
{
        COMPREPLY=()
        cur="${COMP_WORDS[COMP_CWORD]}"
        comp_ssh_hosts=`cat ~/.ssh/config | \
                         grep --color=never "^Host " | \
                         awk '{print $2}'
                   `
        COMPREPLY=( $(compgen -W "${comp_ssh_hosts}" -- $cur))
        return 0
}

complete -F _complete_ssh_hosts ssh
