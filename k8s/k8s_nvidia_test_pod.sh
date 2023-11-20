#!/bin/bash

# Assume the default works. Or use this
# export KUBECONFIG=~/.kube/config.local

create_namespace() {
    F=~/.tmp-k8s-nvidia-pod-test.yaml

    cat <<EOF > $F
apiVersion: v1
kind: Namespace
metadata:
  name: nvidia-test
EOF

    kubectl apply -f $F

    kubectl get ns

}

test_run_pod() {
    kubectl -n nvidia-test run test --restart=Never --image=hello-world -it
    kubectl -n nvidia-test logs test
    kubectl -n nvidia-test delete test
}

# This fails because "ngc" needs "docker". So pull it directly with "ctr"
#   ngc registry image pull nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda11.7.1-ubi8
test_apply_pod() {
    echo "delete pods"
    kubectl -n nvidia-test delete pod vectoradd-test

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

    kubectl -n nvidia-test apply -f $F
    kubectl -n nvidia-test logs vectoradd-test
    kubectl -n nvidia-test delete pod vectoradd-test
}

test_run_cuda() {
    kubectl -n nvidia-test delete pod cuda-test

    # https://catalog.ngc.nvidia.com/orgs/nvidia/containers/cuda
    # https://gitlab.com/nvidia/container-images/cuda/blob/master/doc/supported-tags.md

    # WORKS
    #
    # RHEL8
    #kubectl -n nvidia-test run --rm cuda-test --restart=Never --image=nvcr.io/nvidia/cuda:11.1.1-devel-ubi8 -it -- nvidia-smi
    #kubectl -n nvidia-test run cuda-test --restart=Never --image=nvcr.io/nvidia/cuda:11.1.1-devel-ubi8 -it -- bash
    #
    # UBUNTU
    # kubectl -n nvidia-test run --rm cuda-test --restart=Never --image=nvcr.io/nvidia/cuda:12.2.2-devel-ubuntu22.04 -it -- nvidia-smi
    kubectl -n nvidia-test run --rm cuda-test --restart=Never --image=nvcr.io/nvidia/cuda:12.3.0-devel-ubuntu22.04 -it -- nvidia-smi

    #kubectl -n nvidia-test logs cuda-test
    #kubectl -n nvidia-test delete pod cuda-test
}

create_namespace
#test_run_pod
#test_apply_pod
test_run_cuda
