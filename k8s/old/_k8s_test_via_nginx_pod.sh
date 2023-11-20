#!/bin/bash

# Create deployment
kubectl create deployment  nginx-deployment --image nginx --replicas 2
kubectl get deployment nginx-deployment
kubectl get pods

# Expose deployment
kubectl expose deployment nginx-deployment --type NodePort --port 80
kubectl get svc nginx-deployment

# google-chrome http://localhost:<RANDO-PORT>
