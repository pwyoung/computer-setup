#!/bin/bash

# https://fio.readthedocs.io/en/latest/fio_doc.html
# https://docs.oracle.com/en-us/iaas/Content/Block/References/samplefiocommandslinux.htm

# --rw=
# https://fio.readthedocs.io/en/latest/fio_doc.html#i-o-type

# Random W
#   WRITE: bw=156MiB/s (164MB/s), 156MiB/s-156MiB/s (164MB/s-164MB/s), io=9389MiB (9845MB), run=60012-60012msec
fio --name=random-write --ioengine=posixaio --rw=randwrite --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=60 --time_based --end_fsync=1

# Lessons:
# - 10s is enough for testing
# - no need to name the file
# - changing the ioengine had little effect
#
# Random RW
# READ: bw=84.7MiB/s (88.8MB/s), 84.7MiB/s-84.7MiB/s (88.8MB/s-88.8MB/s), io=5082MiB (5329MB), run=60003-60003msec
# WRITE: bw=84.6MiB/s (88.7MB/s), 84.6MiB/s-84.6MiB/s (88.7MB/s-88.7MB/s), io=5076MiB (5323MB), run=60003-60003msec
fio --name=random-rw --ioengine=posixaio --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=60 --time_based --end_fsync=1
# 106MB/s
fio --name=random-rw --ioengine=posixaio --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=10 --time_based --end_fsync=1
# 101MB/s
fio --name=random-rw --ioengine=posixaio --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=10 --time_based --end_fsync=1
# 118MB/s
fio --name=random-rw --ioengine=libaio --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=10 --time_based --end_fsync=1
# 100MB/s
fio --name=random-rw --ioengine=posixaio --rw=randrw --bs=4k --numjobs=1 --size=4g --iodepth=1 --runtime=60 --time_based --end_fsync=1
#
#
# Lessons:
# - Adding parallel jobs increased throughput, but not linearly
# My test for random-RW
# 165MB/s
fio --name=random-rw --ioengine=posixaio --time_based --end_fsync=1 --size=4g --rw=randrw --bs=4k --numjobs=1 --iodepth=256 --runtime=10 --numjobs=4 --group_reporting

# Lessons:
# - fio will create the directory and file indicated in the "--filename" argument
# - this disk is FAST at 1M block-sized parallel Sequential IOs
# https://portal.nutanix.com/page/documents/kbs/details?targetId=kA07V000000LX7xSAG
# WRITE: bw=14.6GiB/s (15.7GB/s)
fio --name=fiotest --filename=/test/test1 --size=16Gb --rw=write --bs=1M --direct=1 --numjobs=8 --ioengine=libaio --iodepth=8 --group_reporting --runtime=60 --startdelay=1

# Lessons:
# - 64KB random writes are STILL fast
# WRITE: bw=2983MiB/s (3128MB/s)
fio --name=fiotest --filename=/test/test1 --size=16Gb --rw=randwrite --bs=64k --direct=1 --numjobs=8 --ioengine=libaio --iodepth=16 --group_reporting --runtime=60 --startdelay=1
#
# Lessons:
# - with just 1 job, the CPU probably limits the IO that can be generated. But it's still fast.
# WRITE: bw=2647MiB/s (2775MB/s), 2647MiB/s-2647MiB/s
fio --name=fiotest --filename=/test/test1 --size=16Gb --rw=randwrite --bs=64k --direct=1 --numjobs=1 --ioengine=libaio --iodepth=16 --group_reporting --runtime=60 --startdelay=1


# Lessons:
# - 64KB random read is FAST and only a bit slower than 1M random writes
# Reads
# READ: bw=11.9GiB/s (12.7GB/s)
fio --name=fiotest --filename=/test/test1 --size=16Gb --rw=randread --bs=64k --direct=1 --numjobs=8 --ioengine=libaio --iodepth=16 --group_reporting --runtime=60 --startdelay=1
#
# Lessons:
# - With one job, the CPU Probably limited the throughput (to 5GB/s)
# READ: bw=4904MiB/s (5142MB/s)
fio --name=fiotest --filename=/test/test1 --size=16Gb --rw=randread --bs=64k --direct=1 --numjobs=1 --ioengine=libaio --iodepth=16 --group_reporting --runtime=60 --startdelay=1

