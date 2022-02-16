
# https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
source <(kubectl completion bash)
alias k=kubectl
complete -F __start_kubectl k


# Setup a local dev cluster accessible only by SSH
KF=~/.kube/config.local
# stat -f ~/.kube/config.local 2>/dev/null || ssh k-1 'sudo cat /root/.kube/config' > $KF
# Alias to the local cluster
# Use an SSH tunnel that closes itself once it is no longer in use
alias kl="ssh -f -L 6443:127.0.0.1:6443 k-1 'sleep 10' && KUBECONFIG=$KF kubectl"
