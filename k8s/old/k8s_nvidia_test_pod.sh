#!/bin/bash

NS="nvidia-test"
POD="nvidia-cuda-test"

# Temp file
F=~/.tmp-k8s-nvidia-pod-test.yaml

#IMG='nvidia/cuda:11.4.1-base-ubuntu20.04'
#IMG='nvidia/samples:vectoradd-cuda10.2'

# https://catalog.ngc.nvidia.com/orgs/nvidia/teams/k8s/containers/cuda-sample
IMG='nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda10.2'

# export KUBECONFIG=~/.kube/config.local

create_namespace() {
    cat <<EOF > $F
apiVersion: v1
kind: Namespace
metadata:
  name: $NS
EOF

    kubectl apply -f $F

    kubectl get ns

}

test_run_pod() {
    kubectl -n $NS run test --restart=Never --image=hello-world -it
}

# This fails because "ngc" needs "docker". So pull it directly with "ctr"
#   ngc registry image pull nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda11.7.1-ubi8
create_pod() {
    echo "delete pods"
    kubectl -n $NS delete pod vectoradd-test

    F=~/.tmp-k8s-nvidia-pod-test.yaml

    cat <<EOF > $F
apiVersion: v1
kind: Pod
metadata:
  name: vectoradd-test
spec:
  restartPolicy: OnFailure
  containers:
  - name: vectoradd
    image: $IMG
    resources:
      limits:
         nvidia.com/gpu: 1
EOF

    kubectl -n $NS apply -f $F
}

test_hello-world_pod() {
    echo "delete pods"
    kubectl -n $NS delete pod hello-world-test

    F=~/.tmp-k8s-nvidia-pod-test.yaml

    cat <<EOF > $F
apiVersion: v1
kind: Pod
metadata:
  name: hello-world-test
spec:
  restartPolicy: OnFailure
  containers:
  - name: hello-world
    image: "hello-world"
    resources:
      limits:
         nvidia.com/gpu: 1
EOF

    kubectl -n $NS apply -f $F
}

watch_pods() {
    for i in $(seq 1 5); do
        kubectl -n $NS get pods
        sleep 2
    done
}

kill_pod() {
    kubectl -n $NS delete pod $POD
}

fetch_image() {
    sudo ctr image pull $IMG
    sudo ctr image ls -q
}

test_k8s_via_hello_world() {
    kubectl -n $NS run test --restart=Never --image=hello-world -it
}

#test_run_pod
#test_k8s_via_hello_world
#test_hello-world_pod

# TODO: remove this once we give the cluster
# the ability to fetch the image
# fetch_image

create_namespace
#create_pod
#watch_pods
#kill_pod

# TODO: run a test with cuda image
#kubectl -n $NS exec -it $POD -- nvidia-smi
# kubectl -n $NS run test --restart=Never --image=nvcr.io/nvidia/cuda:11.1.1-devel-ubi8 -it -- nvidia-smi
# watch -n 2 'kubectl -n nvidia-test logs test'
#



# YES !!!!
kubectl -n nvidia-test delete pod test
kubectl -n nvidia-test run test --restart=Never --image=nvcr.io/nvidia/cuda:11.1.1-devel-ubi8 -it -- bash

