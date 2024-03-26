# STRATEGY
#
# Since ~/.kube/config tends to become a mess due to auto-merging,
# use separate config files and use KUBECONFIG to specify them.
#
# Keep the original ~/kube/config files around, renamed, for recovery purposes.
#
# IDEALLY, do not allow ~/.kube/config to exist as it could be used accidentally.
#
# Suggestion: make aliases for 'k' and 'kubectl' to refer to the aliases here.

# https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/

LOG=/tmp/kubernetes.sh.out

echo "Start: `date`" | tee $LOG

if command -v kubectl; then
    echo "Setup kubectl cfg" | tee -a $LOG

    if echo $PATH | tr ':' "\n" | egrep '/bin-local'; then
        echo '"bin-local" seems to be in PATH' | tee -a $LOG
    else
        echo '"bin-local" seems to not be in PATH' | tee -a $LOG
    fi
    mkdir -p ~/bin-local

    KCTL="KUBECONFIG=~/.kube/config.local $HOME/bin-local/kubectl"
    HLM="KUBECONFIG=~/.kube/config.local /usr/local/bin/helm"

    F=~/bin-local/h
    #echo "source <(kubectl completion bash)" > $F
    echo "$HLM \$@" > $F
    chmod 0700 $F

    F=~/bin-local/k
    echo "$KCTL \$@" > $F
    #complete -F __start_kubectl k
    chmod 0700 $F
fi

echo "End: `date`" | tee -a $LOG

# Moved from ~/.bash_profile
RANCHER_HOME="${HOME}/.rd"
if [ -e $RANCHER_HOME ]; then
    export PATH=$RANCHER_HOME/bin:$PATH
fi


# For scripting
export K8S_NAMESPACE='phil-young'
export KUBECTL="kubectl -n $K8S_NAMESPACE"
