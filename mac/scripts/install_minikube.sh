#!/bin/sh

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

check_for_hyperkit() {
    if ! which hyperkit >/dev/null; then
	echo "hyperkit should have already been installed by Docker. Exiting."
	exit 1
    else
	hyperkit -v
    fi

    # Per https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#hyperkit-driver
    if [ ! -f /usr/local/bin/docker-machine-driver-hyperkit ]; then
	echo "docker-machine-driver-hyperkit" is not in PATH
	curl -LO https://storage.googleapis.com/minikube/releases/latest/docker-machine-driver-hyperkit \
	    && chmod +x docker-machine-driver-hyperkit \
	    && sudo mv docker-machine-driver-hyperkit /usr/local/bin/ \
	    && sudo chown root:wheel /usr/local/bin/docker-machine-driver-hyperkit \
	    && sudo chmod u+s /usr/local/bin/docker-machine-driver-hyperkit
    fi
}

install_minikube() {
    if ! which minikube >/dev/null; then
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.25.0/minikube-darwin-amd64
	chmod +x minikube
	sudo mv minikube /usr/local/bin/
    fi
    minikube version
}

start_minikube() {
    # https://kubernetes.io/docs/getting-started-guides/minikube/

    D=~/bin
    mkdir -p $D
    F=$D/minikube_start
    cat <<'EOF' > $F
#!/bin/sh

# Start Minikube if it does not already seem to be running

x=$(minikube status | grep Running | wc -l)
if [ $x -ge 2 ]; then
  echo "Minikube is already running";
else
  LOG=~/minikube_start.log

  echo "Starting Minikube and logging output to $LOG"

  # Before changing these, one must delete the old VM
  #   minikube stop ; minikube delete

  OPTS="" # Not specifying the vm driver at all resulted in it using Virtualbox, sucessfully
  OPTS=" --vm-driver hyperkit"
  #OPTS=" --vm-driver=hyperkit" # SNAFU: this freezes...
  #OPTS=" --vm-driver=xhyve" # Deprecated
  #OPTS=" --vm-driver=bhyve" # Deprecated
  #
  #OPTS=" $OPTS --disk-size=64g" # Defaults to 64GB
  #OPTS=" $OPTS --v=3 --logtostderr "
  OPTS=" $OPTS --cpus=4" # Defaults to 2 CPU
  OPTS=" $OPTS --memory=4096 "
  #
  # Uncomment to investigate problems
  #OPTS=" $OPTS --v=999 --logtostderr"

  echo 'Minikube might just hang when starting, due to https://github.com/kubernetes/minikube/issues/227'
  echo 'If so, destroy the cluster by running:'
  echo '  minikube stop ; minikube delete ; rm -rf ~/.minikube'
  echo 'and then restarting this script'

  time minikube start $OPTS | tee $LOG


  minikube status
fi
EOF

    echo "About to start Minikube using $F"
    chmod +x $F
    $F

    echo "Check Minikube"
    minikube ip
    if [ $? -eq 0 ]; then
	echo "minikube is running"
    else
	echo "minikube failed to start. Exiting"
	exit 1
    fi

    echo "Show minikube status"
    minikube status
}

check_for_running_pod() {
    POD="$1"
    SLEEP_INTERVAL="$2"
    MAX_INTERVALS="$3"

    for i in `seq 1 ${MAX_INTERVALS}`; do
	if kubectl get pods --all-namespaces | grep -i running | grep $POD >/dev/null; then
	    echo "POD $POD was found"
	    return 0
	fi
	echo "Check $i/$MAX_INTERVALS for POD $POD"
	sleep $SLEEP_INTERVAL
    done
    echo "POD $POD was not found."
    return 1
}

test_minikube() {
    #https://wikis.forgerock.org/confluence/display/DC/Setting+up+a+Desktop+Kubernetes+Environment+using+minikube

    #echo "Setting DOCKER env variables"
    #eval $(minikube docker-env)
    #echo "Showing DOCKER env variables"
    #printenv | grep DOCKER

    #MINIKUBE_IP=$(minikube ip)
    #curl https://${MINIKUBE_IP} —key ${DOCKER_CERT_PATH}/admin-key.pem —cert ${DOCKER_CERT_PATH}/admin.pem —cacert ${DOCKER_CERT_PATH}/ca.pem

    TAG="hello-minikube"
    echo "Checking Kubernetes Pods for $TAG"
    if ! check_for_running_pod $TAG 1 1; then
	echo "Starting Kubernetes Deployment $TAG via minukube"
	kubectl run $TAG --image=gcr.io/google_containers/echoserver:1.4 --hostport=8000 --port=8080
	if ! check_for_running_pod $TAG  3 20; then
	    echo "Failed to start $TAG"
	    exit 1
	fi
    fi

    POD=$(kubectl get pods | grep $TAG | tail -1 | cut -d' ' -f 1)
    if !echo "hostname -f" | kubectl exec -it $POD bash 2>/dev/null | grep $POD; then
	echo "Test failed. Did not find that he hostname for pod $POD is $POD"
	exit 1
    fi
    echo "The hostname for pod $POD is $POD"

    # EXPOSE a SERVICE
    #  https://kubernetes-v1-4.github.io/docs/user-guide/kubectl/kubectl_expose/
    #  https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#expose
    echo "Checking Kubernetes SERVICES for $TAG"
    if ! kubectl get services --all-namespaces | grep $TAG; then
	kubectl expose deployment hello-minikube --type=NodePort
    fi

    # Read from the exposed/external address to the service
    URL=$(minikube service hello-minikube --url)
    echo "Testing service at $URL"
    curl -F '<body>BODY</body>;type=text/html' $URL

    # Stop exposing the service
    # kubectl delete deployment $TAG
}

test_kubectl() {
    kubectl config view
}

show_kubernetes_info() {
    #https://kubernetes.io/docs/reference/kubectl/cheatsheet/

    #minikube status

    echo "Show Kubernetes cluster info"
    kubectl cluster-info
    echo "Dump some more detailed info about the cluster"
    # kubectl cluster-info dump | jq '.Items[0].Status.NodeInfo, .Items[0].Status.Capacity, .Items[0].Status.Allocatable' | egrep -v '^null$'

    # https://kubernetes.io/docs/getting-started-guides/minikube/#interacting-with-your-cluster
    minikube dashboard
    # IP=$(minikube ip); open http://${IP}:30000

    echo "Show K8S versions supported by this version of minikube"
    minikube get-k8s-versions | head -5

    # Show pods
    kubectl get pods
}

show_virtualbox_info() {
    echo "Seeing if Virtualbox is being used. If we are using the hyperkit driver, then it shouldn't be."

    echo "Showing all VirtualBox VMs"
    /Applications/VirtualBox.app/Contents/MacOS/VBoxManage list vms
    echo "Showing all running VirtualBox VMs"
    /Applications/VirtualBox.app/Contents/MacOS/VBoxManage list runningvms
}

nuke_minikube() {
    #Deal with the fact that sometimes, e.g. after an upgrade, the minikube config file
    # ~/.minikube/machines/minikube/config.json is missing
    # or Minikube just won't start.
    # Nuking this way should restore the file after minikube start
    minikube stop
    minikube delete
    rm -rf ~/.minikube
}

make_profile_script() {
    F=~/.profile.d/eval_docker_machine_for_minikube.sh
    cat <<'EOF' >$F
#!/bin/sh

# This adds a second or so, but it feels worth it for now...

# If Minikube is running, then set the Docker environment to use its VM
if which minikube >/dev/null; then
   if minikube status >/dev/null; then
     # Set default context for kubectl to Minikube
     CONTEXT=$(kubectl config view -o template --template='{{ index . "current-context" }}')
     if [ "$CONTEXT" != "minikube" ]; then
       kubectl config use-context minikube	
     fi 

     # Set Docker (env vars) to use Minikube (VM)
     if ! env | grep DOCK | grep CERT | grep minikube >/dev/null; then
       eval $(minikube docker-env)
     fi     
   fi 
fi 
EOF

}

#nuke_minikube

brew_update
check_for_hyperkit
brew_install kubectl
test_kubectl
install_minikube
make_profile_script
start_minikube
test_minikube
show_kubernetes_info
show_virtualbox_info
