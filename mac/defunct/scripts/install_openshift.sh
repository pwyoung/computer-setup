#!/bin/sh

# GOAL
#   Follow the instructions at https://github.com/STTOOA/wiki/wiki/MacBook-Setup to start
#   The OpenShift cluster
#
# RESOURCES
#   https://github.com/openshift/origin/blob/master/docs/cluster_up_down.md#macos-with-docker-for-mac
#
# NOTES
#   Docker are working to include Kubernetes in their distribution.
#     https://www.infoworld.com/article/3233133/containers/docker-will-include-kubernetes-in-the-box.html
#   Coincidentally, IMO, they have hosed Openshift, at least while using Hyperkit, by breaking support for NO_PROXY
#     https://forums.docker.com/t/no-proxy-no-longer-working-in-mac-17-12-0/44126/6

MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

DOCKER_ENGINE='DOCKER_MACHINE' # Use Docker-machine (Virtualbox)

install_openshift() {
    brew_install openshift-cli
}

make_start_script() {
    F=~/bin/start_openshift_cluster.sh
    cat <<'EOF' >$F
#!/bin/sh

# Avoid errors that happen when VPNed in ("Error: did not detect an --insecure-registry argument on the Docker daemon")
# These can not be fixed with NO_PROXY because Docker currently has a bug and ignores NO_PROXY (via CLI, GUI, and ~/docker/config.json)
# So, use the following eval to tell docker to use the Docker Machine 'openshift'
# See: 
#  https://github.com/openshift/origin/blob/master/docs/cluster_up_down.md#macos-with-docker-for-mac
#  https://forums.docker.com/t/no-proxy-no-longer-working-in-mac-17-12-0/44126/6
#eval $(docker-machine env openshift) 

# Instead of running the above eval, we can just add '--docker-machine=openshift' to 'oc cluster' commands
#oc --docker-machine=openshift cluster up 

oc cluster up 

EOF
    chmod +x $F

}

# TODO: Remove these if Docker-For-Mac works well enough
make_profile_script() {
    
    F=~/.profile.d/eval_docker_machine_for_openshift.sh
    cat <<'EOF' >$F
# If Openshift is running, then set the docker environment to use its VM
if which oc >/dev/null; then
    if oc cluster status >/dev/null; then
	eval $(docker-machine env openshift)	
    fi
fi	
EOF

}
create_docker_machine() {
    if docker-machine status openshift >/dev/null; then
	cat << 'EOF'
The Docker Machine already exists.
To remove the Docker Machine, run:
  docker-machine stop openshift
  docker-machine rm openshift	
EOF
	return
    fi

    oc cluster up --create-machine

    eval $(docker-machine env openshift)     
    oc cluster down 
	
    echo "Docker machine listing"
    docker-machine ls

    #echo "Docker image listing"
    #docker images
}


# Docker-For-Mac needs this
add_insecure_registry() {
    echo "Use Docker-For-Mac. Add Insecure Registry 172.30.0.0/16 to Docker GUI: Docker->Preferences->Daemon->Insecure Registries"
    echo "Hit Enter"
    read OK
    cat ~/.docker/daemon.json
    echo "Hit Enter"    
    read OK
}    

test_openshift() {
    echo "Starting OpenShift cluster"

    LOG_DIR=~/.tmp/openshift
    mkdir -p $LOG_DIR
    LOG=${LOG_DIR}/startup_output.txt
    
    start_openshift_cluster.sh | tee $LOG
    RC=$?

    if [ $RC -ne 0 ]; then
	if grep 'Error: Docker machine exists' $LOG >/dev/null; then
	    cat <<EOF 
You probably need to remove the old cluster image and restart using something like:
  docker-machine stop openshift
  docker-machine rm openshift
EOF
	fi

	if grep 'Error: did not detect an --insecure-registry argument on the Docker daemon' $LOG >/dev/null; then
	    add_insecure_registry
	fi
	
    fi			       
}

support_docker_machine_or_docker_for_mac() {    
    if [ "$DOCKER_ENGINE" = "DOCKER_MACHINE" ] ; then
	make_profile_script 
	create_docker_machine
    else
	add_insecure_registry
    fi
}    

stop_minkube() {
    if which minikube >/dev/null; then
       x=$(minikube status | grep Running | wc -l)
       if [ $x -ge 1 ]; then
	   minikube stop
       fi
    fi
}


stop_minkube
install_openshift
make_start_script
support_docker_machine_or_docker_for_mac
test_openshift
