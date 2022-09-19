#!/bin/bash

# Resources
#   https://blog.purestorage.com/purely-technical/io-plumbing-tests-with-fio/
#   https://arstechnica.com/gadgets/2020/02/how-fast-are-your-disks-find-out-the-open-source-way-with-fio/

#D=$HOME/tmp-disk-test
D=./tmp-disk-test
LOG=$D/disk-test.log

initialize() {
    mkdir -p $D
    cd $D
    echo "" > $LOG
    echo "Start:`date`" >> $LOG
}

install_deps() {
    echo "install deps"
    sudo apt-get install -y fio ioping
}

disk_tests_timed() {
    T=12
    #T=600

    echo "Sequential Read Operation Test"
    # Sequential Reads – Async mode – 8K block size – Direct IO – 100% Reads
    fio --name=seqread --rw=read --direct=1 --ioengine=libaio --bs=8k --numjobs=8 --size=1G --runtime=$T --group_reporting

    # Sequential Writes – Async mode – 32K block size – Direct IO – 100% Writes
    echo "Sequential Write Operation Test"
    fio --name=seqwrite --rw=write --direct=1 --ioengine=libaio --bs=32k --numjobs=4 --size=2G --runtime=$T --group_reporting

    # Random Read/Writes – Async mode – 16K block size – Direct IO – 90% Reads/10% Writes
    fio --name=randrw --rw=randrw --direct=1 --ioengine=libaio --bs=16k --numjobs=8 --rwmixread=90 --size=1G --runtime=$T --group_reporting

    return

    # Quick dev/test
    T=5
    I=1
    C=1
    E=libaio

    # These use fsync at the end of the test to complete IO

    echo "Random Write Operation Test"
    fio --name=random-write --ioengine=$E --rw=randwrite --bs=4k --numjobs=1 --size=4g --iodepth=$I --runtime=$T --time_based --end_fsync=1 | tee -a $LOG

    echo "Sequential Write Operation Test"
    fio --name=sequential-write --ioengine=$E --rw=write --bs=32k --numjobs=1 --size=4g --iodepth=$I --runtime=$T --time_based --end_fsync=1 | tee -a $LOG

    echo "Timed Random Read/Write Operation Test: $T seconds"
    fio --name=random-readwrite --ioengine=$E --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=$I --runtime=$T --time_based --end_fsync=1 | tee -a $LOG
}

disk_latency_tests() {
    echo "Check Latency: to /tmp/"
    ioping -c $C /tmp/ | tee -a $LOG

    echo "Check Latency: to $HOME/"
    ioping -c $C $HOME/ | tee -a $LOG
}


initialize

install_deps

disk_tests_timed

disk_latency_tests

echo "End:`date`" | tee -a $LOG
