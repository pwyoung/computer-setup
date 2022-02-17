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
source <(kubectl completion bash)
alias k=kubectl
complete -F __start_kubectl k

# Alias for accessing Minikube
alias km="KUBECONFIG=~/.kube/config.minikube /usr/local/bin/kubectl"
complete -F __start_kubectl km
alias hm="KUBECONFIG=~/.kube/config.minikube /usr/local/bin/helm"

# Setup a local dev cluster accessible only by SSH
# KF=~/.kube/config.local
# stat -f ~/.kube/config.local 2>/dev/null || ssh k-1 'sudo cat /root/.kube/config' > $KF
# Alias to the local cluster
# Use an SSH tunnel that closes itself once it is no longer in use
alias kl="ssh -f -L 6443:127.0.0.1:6443 k-1 'sleep 10' && KUBECONFIG=~/.kube/config.local /usr/local/bin/kubectl"
complete -F __start_kubectl kl
alias hl="ssh -f -L 6443:127.0.0.1:6443 k-1 'sleep 10' && KUBECONFIG=~/.kube/config.local /usr/local/bin/helm"



# status
S='----> '
alias k8s="echo '$S minikube' && km cluster-info; echo '$S local' && kl cluster-info"
