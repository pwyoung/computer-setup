#!/bin/bash

NS="nvidia-test"
POD="nvidia-cuda-test"

# Temp file
F=~/.tmp-k8s-nvidia-pod-test.yaml

export KUBECONFIG=~/.kube/config.k3s

create_namespace() {
    cat <<EOF > $F
apiVersion: v1
kind: Namespace
metadata:
  name: $NS
EOF

    kubectl get ns

}

# TODO: remove/merge
create_pod_OLD() {
    F=~/.tmp-k8s-nvidia-pod-test.yaml

    cat <<EOF > $F
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: nvidia
handler: nvidia
---
apiVersion: v1
kind: Pod
metadata:
  name: $POD
  namespace: $NS
spec:
  restartPolicy: OnFailure
  runtimeClassName: nvidia
  containers:
  - name: cuda-container
    image: nvcr.io/nvidia/k8s/cuda-sample:nbody
    args: ["nbody", "-gpu", "-benchmark"]
    resources:
      limits:
        nvidia.com/gpu: 1
    env:
    - name: NVIDIA_VISIBLE_DEVICES
      value: all
    - name: NVIDIA_DRIVER_CAPABILITIES
      value: all
EOF

    kubectl -n $NS apply -f $F
    kubectl -n $NS get pods,svc
}

create_pod() {
    F=~/.tmp-k8s-nvidia-pod-test.yaml

    cat <<EOF > $F
apiVersion: v1
kind: Pod
metadata:
  name: $POD
spec:
  restartPolicy: Never
  containers:
    - name: $POD
      image: "nvidia/cuda:11.4.1-base-ubuntu20.04"
      command: [ "/bin/bash", "-c", "--" ]
      args: [ "while true; do sleep 30; done;" ]
      resources:
        limits:
          nvidia.com/gpu: 1
EOF

    kubectl -n $NS apply -f $F
    kubectl -n $NS get pods,svc
}

# TODO: exit after pod is "running"
watch_pod() {
    for i in $(seq 1 5); do
        kubectl -n $NS get pods
        sleep 2
    done
}

run_pod() {
    kubectl -n $NS exec -it $POD -- nvidia-smi
}

kill_pod() {
    kubectl -n $NS delete pod nbody-gpu-benchmark
}

create_namespace
create_pod
watch_pod
run_pod
kill_pod
