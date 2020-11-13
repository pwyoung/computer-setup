#!/usr/bin/bash
#
##!/usr/bin/env bash

# Exit on error
set -e

SRC=/data
DST=/mnt/data_backup_internal

waitforit() {
    echo "hit enter (or control-c)"
    read -p OK
}

echo "show source"
ls -ld $SRC/* 
waitforit

echo "show destination"
ls -ld $DST 
waitforit

OPTS="-avhW --no-compress --progress"
#OPTS+=" --dry-run"
time rsync $OPTS $SRC/ $DST/
