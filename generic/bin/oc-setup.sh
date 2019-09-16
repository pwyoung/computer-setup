#!/bin/bash
#
# Purpose: Set up OpenShift given a local docker. This assumes that all the
# install work has already been done. This script works with a pre-existing
# oc client, and docker install. Please follow the OS-specific / distro-
# specific machine setup procedure before using this script.
#
# This script is OS/distro neutral.

#set -ex
err_handler() {
    echo "Exiting $0 due to error on line $1"
    exit 1
}
trap 'err_handler $LINENO' ERR

function openshift () {

  docker run --rm hello-world
  
  # Make sure that the openshift required 172.30.0.0/16 insecure registry is set
  docker info | sed -e '1,/Insecure Registries:/d' -e '/^[^ ]/,$d' | grep -q -F '172.30.0.0/16'
  
  # If you want to access oc from another host, set something like:
  # export MY_OC_CLUSTER_UP_ARGS="--public-hostname=$(hostname -A)" 
  # assuming 'hostname -A' gives your hostname in FQDN format.
  oc cluster status >/dev/null 2>&1 || \
    oc cluster up $MY_OC_CLUSTER_UP_ARGS
  
  for (( i=0; i<30; i++ ))
  do
    oc cluster status >/dev/null 2>&1 && break || true
    sleep 5
  done
  oc cluster status
  

  #############################################################################
  ### Now set up openshift for use in Trio ####################################
  #############################################################################
  
  oc login -u system:admin
  oc patch scc restricted -p '{"allowHostDirVolumePlugin":true}'
  oc patch scc restricted -p '{"allowPrivilegedContainer":true}'
  oc patch scc restricted -p '{"runAsUser":{"type":"RunAsAny"}}'
  oc patch scc restricted -p '{"fsGroup":{"type":"RunAsAny"}}'
  oc login -u developer -p foo
  oc project myproject

  #############################################################################
  ### k8s / openshift is running so now roll out helm #########################
  #############################################################################

  export TILLER_NAMESPACE=myproject
  helm init --tiller-namespace=myproject
  oc adm policy add-role-to-user admin system:serviceaccount:myproject:default
  for (( i=0; i<10; i++ ))
  do
    echo Waiting for tiller to start
    if kubectl get pods | grep ^tiller-deploy | grep Running | grep "1/1"
    then
      break
    fi
    sleep 5
  done
  kubectl get all
  kubectl describe pods tiller-deploy
  helm version

  # Test helm using stable Jenkins chart. Selected because it uses secrets
  # pvc similar to the services that we care about.
  helm install --name smoke-test stable/jenkins
  helm ls smoke-test
  kubectl describe pvc/smoke-test-jenkins
  kubectl describe secret/smoke-test-jenkins
  helm delete --purge smoke-test

  # Add helm repositories that we'll want. Incubator for kafka. Eventually we'll
  # want to add repos for sttooa.
  helm repo add incubator http://storage.googleapis.com/kubernetes-charts-incubator
}

######################################################################
### And finally, 'main'. Parse args & do the right thing. ############
######################################################################

while [ $# -gt 0 ]
do
  case "$1" in

  --debug)
    set -x
    ;;

  --no-debug)
    set +x
    ;;

  *)
    echo "ERROR: Unknown arg \"$1\"" >&2
    exit 1
    ;;
  esac

  shift
done

openshift
