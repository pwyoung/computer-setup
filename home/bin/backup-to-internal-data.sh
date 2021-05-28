#!/usr/bin/bash
#
##!/usr/bin/env bash

# Exit on error
set -e

SRC=/data
DST=/media/pwyoung/2120ab71-c818-4655-a4e7-b1a941169938/backup/internal

waitforit() {
    echo "hit enter (or control-c)"
    read -p OK
}

echo "show destination"
ls -ld $DST/*
waitforit

echo "show source"
ls -ld $SRC/*
waitforit

OPTS="-avhW --no-compress --progress"
#OPTS+=" --dry-run"
time rsync $OPTS $SRC/ $DST/
