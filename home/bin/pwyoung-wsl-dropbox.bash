#!/usr/bin/bash

LOG=/tmp/dropbox.sh.$USER.log

THISSCRIPT=$0

SVC=drop-box
SVCSCRIPT=/lib/systemd/system/$SVC.service

run_command() {
    echo "This will call '/opt/dropbox/dropboxd' to keep ~/DropBox up to date"
    /opt/dropbox/dropboxd | tee $LOG
}

install_service() {
    mkdir -p ~/DropBox

    cat <<EOF | sudo tee $SVCSCRIPT
[Unit]
Description=Call script to monitor (synch) ~$USER/DropBox

[Service]
ExecStart=/bin/bash -c '$THISSCRIPT -x'
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable $SVC.service
    sudo systemctl start $SVC.service
    sudo systemctl status $SVC.service
}

stop_service() {
    sudo systemctl stop $SVC
}

start_service() {
    sudo systemctl start $SVC
}

status_service() {
    sudo systemctl status $SVC
}

show_service_log() {
    tail -99f $LOG
}

uninstall_service() {
    sudo systemctl stop $SVC
    sudo systemctl disable $SVC
    sudo systemctl daemon-reload
    sudo systemctl reset-failed

    sudo rm $SVCSCRIPT
    rm $LOG
}

show_usage(){
    cat <<EOF
This script can run a command (via -x) and manage a service to run that command as the
current user.

Usage: $0 arg

Args with their long-forms
        -x|--execute: run 'dropboxd' comand (this is called by the service)
        -i|--install: install the service
        -u|--uninstall: uninstall the service
        -t|--start: start the service
        -p|--stop: stop the service
        -s|--status: show status of the service
        -l|--show-log:show service log
        -h|--help: show this help

Example: Install the service, show its status and log
$0 -i -t -l
EOF
}

if [[ $# -eq 0 ]]; then
    show_usage
    exit 1
fi

while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
        -x|--execute)
            shift
            run_command
            ;;
        -t|--start)
            shift
            start_service
            ;;
        -p|--stop)
            shift
            stop_service
            ;;
        -s|--status)
            shift
            status_service
            ;;
        -l|--show-log)
            shift
            show_service_log
            ;;
        -i|--install)
            shift
            install_service
            ;;
        -u|--uninstall)
            uninstall_service
            shift
            ;;
        -h|--help)
            show_usage
            shift
            ;;
        *)
            echo "unknown option '$1'"
            show_usage
            exit 1
            ;;
    esac
done
