#!/bin/sh

# GOAL: Test siege4oss against Ceph

cd ~/Documents/repos/pwyoung/storage-infrastructure/docker-siege4oss

MY_PATH=$( cd $(dirname "$0") && pwd -P)

err_handler() {
    echo "Exiting $0 due to error on line $1"
    exit 1
}
trap 'err_handler $LINENO' ERR

# https://github.com/fwessels/siege4oss
install_mac_dependencies() {
    brew install mc parallel
    brew install minio/stable/mc
    #siege (NB Make sure to use a version 3.0.x -- not the latest)
    cd /tmp
    wget http://download.joedog.org/siege/siege-3.0.9.tar.gz
    tar xvzf siege-3.0.9.tar.gz
}

install_centos_dependencies() {
    yum install mc parallel

    cd /usr/local/bin
    wget https://dl.minio.io/client/mc/release/linux-amd64/mc
    chmod +x mc

    #siege (NB Make sure to use a version 3.0.x -- not the latest)
    mkdir -p /root/siege_309
    cd /root/siege_309
    wget http://download.joedog.org/siege/siege-3.0.9.tar.gz
    tar xvzf siege-3.0.9.tar.gz

    /usr/local/bin/siege --version

    # 1TB in size
    # siege -i
}

run_containerized_test() {

    ## Step 1: tmpfs-backed Minio
    echo "Using existing Ceph cluster"

    ## Step 2: Generate test data
    # NOTE: If the ENDPOINT_ACCESS_KEY has fewer than 5 characters, "mc config host add" will fail
    # NOTE: Changed ENDPOINT_URL to HTTP, from HTTPS.
    cat <<EOF > tmpfs.env
SIEGE_TIME='10s'
SIEGE_CONCURRENT='64'
ENDPOINT_URL='http://10.1.41.80:9000'
ENDPOINT_ACCESS_KEY='Q3AM3UQ867SPQQA43P2F'
ENDPOINT_SECRET_KEY='zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
EOF

    # NOTE: need to create this dir
    sudo mkdir -p /var/run/siege4oss
    sudo chmod 777 /var/run/siege4oss

    eval $(cat tmpfs.env) ./siege4oss generate

    ## Step 3b: Run containerized benchmark
    #docker run -i -t --network host --env-file tmpfs.env -v "$(pwd)"/log/:/var/run/siege4oss/log/ siege4oss siege
}

manually_test_ceph_with_mc() {
    # Make a ceph user with the same keys as minio
    # ssh dell01-svr08
    # sudo su -
    # radosgw-admin user create --uid="testsiege" --display-name="testsiege"
    # radosgw-admin key create --uid='testsiege' --key-type=s3 --access-key 'Q3AM3UQ867SPQQA43P2F' --secret-key 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
    # Test this via boto (made /usr/local/bin/test_s3-2.py and tested)

    # Test via mc on Mac (note siege4oss uses /var/run/siege/config.json) so this is separate
    mc config host add s3 http://10.1.41.80:9000 Q3AM3UQ867SPQQA43P2F zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG
    mc ls s3

    #mc config host add s3 https://10.1.41.80:9000 Q3AM3UQ867SPQQA43P2F zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG
    #mc: <ERROR> Unable to initialize new config from the provided credentials. Get https://10.1.41.80:9000/probe-bucket-sign/?location=: http: server gave HTTP response to HTTPS client
}

run_containerized_test
