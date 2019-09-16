#!/bin/sh

# GOAL:
#   Create some useful symlinks

echo "This script sets up symlinks for /data and /backup"
echo "The idea is for /data to point to your important data, i.e. ~/Documents"
echo "and for /backup to point to a device/path suitable for backing up /data"

if [ ! -s /data ]; then
    sudo ln -s $HOME/Documents /data
fi
ls -ld /data

if [ ! -s /backup ]; then
    echo "Enter a path to an existing folder which will hold the data dir to be backed up"
    echo "e.g. /Volumes/samsung_1tb/backups/personal_macbook_pro_2015"
    read BACKUP_DIR
    
    if [ ! -d $BACKUP_DIR ]; then
	echo "BACKUP_DIR $BACKUP_DIR does not exist!"
	exit 1
    fi
    
    sudo ln -s $BACKUP_DIR /backup
fi
ls -ld /backup
