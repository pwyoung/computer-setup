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

