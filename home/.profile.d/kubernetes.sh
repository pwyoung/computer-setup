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

if command -v kubectl; then
    source <(kubectl completion bash)

    alias kl="KUBECONFIG=~/.kube/config.local /home/pyoung/bin-local/kubectl"
    alias hl="KUBECONFIG=~/.kube/config.local /usr/local/bin/helm"
    complete -F __start_kubectl kl


    alias k=kubectl
    complete -F __start_kubectl k
fi

