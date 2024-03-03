#!/bin/bash

# Create the pod definition file
cat <<EOF > nvidia-smi.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nvidia-smi-pod
  labels:
    nvidia.com/gpu: present
spec:
  containers:
    - image: nvidia/cuda:11.6.2-base-ubuntu20.04
      name: nvidia-smi
      command: ["nvidia-smi"]
      resources:
        limits:
          nvidia.com/gpu: 1
EOF

# Apply the pod definition
kubectl apply -f nvidia-smi.yaml

# Wait for the pod to become ready (adjust timeout if needed)
kubectl wait --for=condition=ready pod/nvidia-smi-pod --timeout=60s

# Execute nvidia-smi inside the pod
kubectl exec -it nvidia-smi-pod -- nvidia-smi

# Optionally delete the pod
kubectl delete pod nvidia-smi-pod
