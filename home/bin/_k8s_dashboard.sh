#!/bin/bash

# Add K3S Dashboard
#   Per https://www.linuxbuzz.com/install-k3s-kubernetes-cluster-on-ubuntu/

TOKEN=~/.tmp-k8s-token.txt

add_k8s_dashboard() {
    # Install Kubernetes dashboard
    export KUBECONFIG=~/.kube/config.k3s && \
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml && \
        kubectl get pods,svc -n kubernetes-dashboard

    # Change the service type from ClusterIP to Nodeport
    export KUBECONFIG=~/.kube/config.k3s && \
        kubectl patch svc kubernetes-dashboard --type='json' -p '[{"op":"replace","path":"/spec/type","value":"NodePort"}]' -n kubernetes-dashboard && \
	kubectl get svc -n kubernetes-dashboard

    # create service account and assign cluster role to it
    F=~/.tmp-k3s-dashboard.yaml
    cat <<EOF > $F
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kube-system
EOF
    kubectl create -f $F
    rm $F

    F=$TOKEN
    if [ ! -e $F ]; then
        echo "Token file exists, not creating token for dashboardin K8S"
    else
        kubectl -n kube-system  create token admin-user 2>&1 | tee $F
    fi
    echo "Dashboard token is: $F"

    export KUBECONFIG=~/.kube/config.k3s && \
        kubectl -n kubernetes-dashboard  get all
}

open_k8s_dashboard() {
    PORT=$(kubectl -n kubernetes-dashboard get svc | egrep '^kubernetes-dashboard' | awk '{print $5}' | cut -d ':' -f 2 | cut -d '/' -f 1)
    TOKEN=$(cat $TOKEN)
    echo "The K8S Dashboard (service account) token is:"
    echo "$TOKEN"
    echo "Open a browser to https://localhost:$PORT"
}

add_k8s_dashboard

open_k8s_dashboard
