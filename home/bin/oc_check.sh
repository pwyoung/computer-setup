#!/bin/sh

cat <<EOF >/dev/null
WARNING: An HTTP proxy (docker.for.mac.http.internal:3128) is configured for the Docker daemon, but you did not specify one for cluster up
WARNING: An HTTPS proxy (docker.for.mac.http.internal:3129) is configured for the Docker daemon, but you did not specify one for cluster up
WARNING: A proxy is configured for Docker, however 172.30.1.1 is not included in its NO_PROXY list.
   172.30.1.1 needs to be included in the Docker daemon's NO_PROXY environment variable so pushes to the local OpenShift registry can succeed.
phillips-MacBook-Pro:mac_setup phillipyoung$ kubectl top node
Error from server (Forbidden): User "developer" cannot get services/proxy in the namespace "kube-system": User "developer" cannot get services/proxy in project "kube-system" (get services http:heapster:)
EOF

#oc login -u system:admin

USER=$(oc whoami) # developer
USER_T=$(oc whoami -t) # kNxp9qYzfsrrGtLZhPR1zXv-SjvzgRKq2HrOMFH7E_Y

# Per https://github.com/openshift/origin/issues/10806
#curl -k -H "Authorization: Bearer ${USER_T}" -X GET https://localhost:8443/api/v1/proxy/namespaces/openshift-infra/services/https:heapster:/api/v1/model/metrics
curl -k -H "Authorization: Bearer ${USER}" -X GET https://localhost:8443/api/v1/proxy/namespaces/openshift-infra/services/https:heapster:/api/v1/model/metrics
