#!/bin/bash

# GOAL: run SSHD as a normal user.

# Resources
#   https://linux.die.net/man/8/sshd

SSHD_DIR=~/custom_ssh
SSHD_PORT=1025

SSHD_BIN=`which sshd`
SSHD_CFG=${SSHD_DIR}/sshd_config
SSHD_PIDFILE=${SSHD_DIR}/sshd.pid
SSHD_HOST_RSA_KEY=${SSHD_DIR}/ssh_host_rsa_key
SSHD_HOST_DSA_KEY=${SSHD_DIR}/ssh_host_dsa_key
SSHD_LOG=${SSHD_DIR}/sshd.log

usage() {
    cat <<EOF
    USAGE:
    $0: start sshd
    $0 -k: Kill processes spawned by this tool*
    *: This identifies processes to kill via "ps" and the pidfile this uses.
EOF
}

exit_if_server_is_running() {
    if [ -f ${SSHD_PIDFILE} ]; then
	if kill -s 0 $(cat ${SSHD_PIDFILE}) >/dev/null 2>&1; then
	    echo "Custom server is already running. PID=$(cat ${SSHD_PIDFILE})"
	    exit 0
	fi
    fi
}

create_host_keys() {
    mkdir -p ${SSHD_DIR}

    if [ ! -f ${SSHD_HOST_RSA_KEY} ]; then
	ssh-keygen -f ${SSHD_HOST_RSA_KEY} -N '' -t rsa
    fi

    if [ ! -f ${SSHD_HOST_DSA_KEY} ]; then
	ssh-keygen -f ${SSHD_HOST_DSA_KEY} -N '' -t rsa
    fi
}

create_config() {
    # Look at this machine's config
    # cat /etc/ssh/sshd_config  | egrep -v '^#' | egrep -v '^$'

    cat <<EOF > ${SSHD_CFG}
Port ${SSHD_PORT}

HostKey ${SSHD_DIR}/ssh_host_rsa_key
HostKey ${SSHD_DIR}/ssh_host_dsa_key

# Allow SSH key auth
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# These seem irrelvant (on Mac anyway)
#ChallengeResponseAuthentication no
#UsePAM yes
#
#ChallengeResponseAuthentication no
#UsePAM no
#
ChallengeResponseAuthentication yes
UsePAM yes

#Subsystem   sftp    /usr/lib/ssh/sftp-server
# Mac
Subsystem	sftp	/usr/libexec/sftp-server
AcceptEnv LANG LC_*
PidFile ${SSHD_PIDFILE}
EOF
}

run_server() {
    OPTS="-f ${SSHD_CFG}"
    #OPTS+=" -D" # Do not detach/daemonize
    #OPTS+=" -e" # Send output to STDERR (not logs)
    #OPTS+=" -d" # Debug mode
    CMD="${SSHD_BIN} ${OPTS}"
    echo "Running ${CMD}"
    #${SSHD_BIN} ${OPTS} 2>&1 | tee ${SSHD_LOG} &
    ${CMD} 2>&1 | tee ${SSHD_LOG} &
    echo "Custom SSHD Process ID: `cat ${SSHD_DIR}/sshd.pid`"
}

# Kill the PID in the pid file
# If no PID file is found, use a heuristic "ps" to kill processes
# that look like our sshd instances.
kill_server() {
    if [ -f ${SSHD_PIDFILE} ]; then
	PID=$(cat ${SSHD_PIDFILE})
	if kill -s 0 $PID >/dev/null 2>&1; then
	    echo "Killing process from pidfile with PID: $PID"
	    kill -15 $PID
	fi
    else
	echo "No PIDFILE: ${SSHD_PIDFILE}"
	# Deal with the fact that the pidfile is not created
	PIDS=$(ps eax | grep -v grep | grep "sshd -f ${SSHD_CFG}" | awk '{print $1}' | tr "\n" " ")
	for PID in $PIDS; do
	    if kill -s 0 $PID >/dev/null 2>&1; then
		echo "Killing process found with PID: $PID"
		kill -15 $PID
	    fi
	done
    fi
}

if [ "$1" == "-k" ]; then
    kill_server
    exit 0
fi

exit_if_server_is_running
create_host_keys
create_config
run_server
