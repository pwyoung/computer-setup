#!/usr/bin/env bash

set -e

# GOAL
#   Set up Kerberos on Cygwin

# Docs
#   Cygwin Kerberos docs
#     http://computing.help.inf.ed.ac.uk/kerberos-cygwin
#   Windows Keytab docs
#     https://docs.microsoft.com/en-us/archive/blogs/pie/all-you-need-to-know-about-keytab-files

################################################################################
# PARAMETERS
################################################################################

# Put files fetched under this dir
LOCALDIR=~/from_hadoop_dev

# KERBEROS
#
PRINCIPAL=srvredi@IPA.AM.TSACORP.COM
KEYTAB=$LOCALDIR/srvredi.keytab

# SPARK-SUBMIT
APPLICATION_CONF=$LOCALDIR/application.conf
JAAS_CONF=$LOCALDIR/jaas.conf
DEVTEST_KEYTAB=$LOCALDIR/devtest1.keytab
KEYSTORE=$LOCALDIR/keystore

# HADOOP
HADOOP_CONF=$LOCALDIR/hadoop_conf

# REMOTE FILES
#
KEYTAB_SRC=hadoop-dev:/home/srvredi/keytabs/srvredi.keytab
#
APPLICATION_CONF_SRC=hadoop-dev:/home/srvredi/kp/rel51/application.conf
JAAS_CONF_SRC=hadoop-dev:/etc/security/keytabs/jaas.conf
KEYSTORE_SRC=hadoop-dev:/home/srvredi/keystore_dev
DEVTEST_KEYTAB_SRC=hadoop-dev:/etc/security/keytabs/devtest1.keytab
#
HADOOP_CONF_SRC=hadoop-dev:/usr/hdp/current/hadoop-client/conf
################################################################################

install_os_packages() {
    apt-cyg install krb5-workstation openssh
}


install_krb5_conf() {

    # From docs
    cat << EOF > /dev/null
    [libdefaults]
        default_realm = INF.ED.AC.UK
        forwardable = true
EOF


    KDC=kerberos.ipa.am.tsacorp.com
    #ping -c 1 $KDC

    F=/etc/krb5.conf
    cat <<EOF > $F
 cat /etc/krb5.conf

[libdefaults]
  renew_lifetime = 7d
  forwardable = true
  default_realm = IPA.AM.TSACORP.COM
  ticket_lifetime = 24h
  dns_lookup_realm = false
  dns_lookup_kdc = false
  default_ccache_name = /tmp/krb5cc_%{uid}
  #default_tgs_enctypes = aes des3-cbc-sha1 rc4 des-cbc-md5
  #default_tkt_enctypes = aes des3-cbc-sha1 rc4 des-cbc-md5
  rdns = false
  udp_preference_limit=1

[logging]
  default = FILE:/var/log/krb5kdc.log
  admin_server = FILE:/var/log/kadmind.log
  kdc = FILE:/var/log/krb5kdc.log

[realms]
  IPA.AM.TSACORP.COM = {
    admin_server = kerberos.ipa.am.tsacorp.com
    kdc = kerberos.ipa.am.tsacorp.com
  }

EOF

    echo "If I had the password I could: kinit -V srvredi@IPA.AM.TSACORP.COM"
}

not_used_setup_ssh_config() {
    #    Create the file .ssh/config in your home directory and populate it as follows:

    # Per docs
    cat <<EOF >/dev/null
    Host *.inf.ed.ac.uk
        User <yourusername>
        GSSAPIAuthentication yes
        GSSAPIDelegateCredentials yes
EOF
}


notes_kps_spark_submit_command(){
    cat <<EOF
    /usr/hdp/current/spark2-client/bin/spark-submit --master yarn \
--driver-memory 1G --executor-memory 2G --num-executors 4 --executor-cores 2 \
--queue ReDi-Batch --name $APP_NAME --deploy-mode cluster --conf spark.memory.fraction=0.8 \
--conf spark.scheduler.maxRegisteredResourcesWaitingTime=60s \
--conf spark.driver.extraClassPath="/usr/hdp/current/spark2-client/jars/ojdbc6-11.2.0.3.jar" \
--keytab /home/srvredi/keytabs/srvredi.keytab --principal srvredi@IPA.AM.TSACORP.COM \
--conf spark.security.credentials.hiveserver2.enabled=false \
--conf "spark.driver.extraJavaOptions=-Duser.timezone=UTC" \
--conf "spark.executor.extraJavaOptions=-Duser.timezone=UTC" \
--jars $(echo /home/srvredi/encryptor.properties,/apps/ReDi/ReDi_ext_jars/core*.jar,/apps/ReDi/ReDi_ext_jars/encryptor-1.0.jar,/apps/ReDi/lib/config-1.3.2.jar,/apps/ReDi/lib/log4j*.jar,/apps/ReDi/lib/ojdbc6-11.2.0.3.jar,/usr/share/java/kafka-rest/*.jar,/usr/share/java/confluent-common/*.jar,/apps/ReDi/lib/avro-1.8.2.jar,/home/srvredi/kp/common/redi-common-5.2-SNAPSHOT.jar,/usr/hdp/current/hive_warehouse_connector/*.jar | tr ' ' ',' ) \
--conf "spark.serializer=org.apache.spark.serializer.KryoSerializer" \
--conf "spark.driver.extraJavaOptions=-Djava.security.auth.login.config=jaas.conf -Djavax.net.ssl.trustStore=keystore_dev" \
--conf "spark.executor.extraJavaOptions=-Djava.security.auth.login.config=jaas.conf -Djavax.net.ssl.trustStore=keystore_dev" \
--files "/home/srvredi/kp/rel51/application.conf,/etc/security/keytabs/jaas.conf,/etc/security/keytabs/devtest1.keytab,/home/srvredi/keystore_dev" \
--class com.aciworldwide.ra.redi.common.actions.OperationalKPIProcess /home/srvredi/kp/common/redi-common-5.2-SNAPSHOT.jar
EOF



    # JARs
    #--jars $(echo /home/srvredi/encryptor.properties,/apps/ReDi/ReDi_ext_jars/core*.jar,/apps/ReDi/ReDi_ext_jars/encryptor-1.0.jar,/apps/ReDi/lib/config-1.3.2.jar,/apps/ReDi/lib/log4j*.jar,/apps/ReDi/lib/ojdbc6-11.2.0.3.jar,/usr/share/java/kafka-rest/*.jar,/usr/share/java/confluent-common/*.jar,/apps/ReDi/lib/avro-1.8.2.jar,/home/srvredi/kp/common/redi-common-5.2-SNAPSHOT.jar,/usr/hdp/current/hive_warehouse_connector/*.jar | tr ' ' ',' )
    #--class com.aciworldwide.ra.redi.common.actions.OperationalKPIProcess /home/srvredi/kp/common/redi-common-5.2-SNAPSHOT.jar

    #--conf "spark.driver.extraJavaOptions=-Djava.security.auth.login.config=jaas.conf -Djavax.net.ssl.trustStore=keystore_dev"
    #--conf "spark.executor.extraJavaOptions=-Djava.security.auth.login.config=jaas.conf -Djavax.net.ssl.trustStore=keystore_dev"

    #--files "/home/srvredi/kp/rel51/application.conf,/etc/security/keytabs/jaas.conf,/etc/security/keytabs/devtest1.keytab,/home/srvredi/keystore_dev"

}

# Get the keytab from the remote machine
install_krb5_conf(){
    scp $KEYTAB_SRC $KEYTAB
    chmod -R 440 $KEYTAB
    klist -k $KEYTAB
    klist
    kinit $PRINCIPAL -k -t $KEYTAB
    klist
}

get_security_files(){
    scp $APPLICATION_CONF_SRC $APPLICATION_CONF
    scp $JAAS_CONF_SRC $JAAS_CONF
    scp -r $KEYSTORE_SRC $KEYSTORE
    scp $DEVTEST_KEYTAB_SRC $DEVTEST_KEYTAB
}

TODO_hdfs_setup() {
    # Install HAdoop binary
    # Set "HADOOP_HOME" and "JAVA_HOME"
    #
    #  Old: 3.1.1:  https://hadoop.apache.org/old/releases.html
    #  "new": https://hadoop.apache.org/releases.html

    # Hadoop Kerberos setup
    #   https://gpdb.docs.pivotal.io/560/best_practices/kerberos-hdfs.html
    # cloudera
    #   https://godatadriven.com/blog/setting-up-kerberos-authentication-for-hadoop-with-cloudera-manager/

    # HDP
    #   https://community.cloudera.com/t5/Support-Questions/How-to-install-HDP-client-software-on-Windows-7-machine-and/td-p/155495
    # When you copy /usr/hdp/<version>/hadoop/ and /usr/hdp/<version>/hive/ will have the required conf directory which would have all the files

    # Test
    export HADOOP_OPTS="-Dsun.security.krb5.debug=true"
    hadoop fs -ls
    
}

install_jce() {
    # https://godatadriven.com/blog/setting-up-kerberos-authentication-for-hadoop-with-cloudera-manager/#jce

    # Oracle docs

    # How to enable JCE
    #  This says that on the right version of java, we can edit a file
    #    https://github.com/open-eid/cdoc4j/wiki/Enabling-Unlimited-Strength-Jurisdiction-Policy
    #  This says to download jars
    #   https://docs.oracle.com/cd/E84221_01/doc.8102/E84237/index.htm?toc.htm?212338.htm
    # Oracle download
    #   https://www.oracle.com/java/technologies/javase-downloads.html
    #    "The unlimited policy files for earlier releases available here are required only for JDK 8, 7, and 6 updates earlier than 8u161, 7u171, and 6u16. On    # those versions and later the policy files are included, but not enabled by default."
    #
    # On Debian
    #  https://docs.datastax.com/en/ddacsecurity/doc/ddacsecurity/installJCE.html
    # sudo apt-get install oracle-java8-unlimited-jce-policy

    # This might not be needed, according to the rules in $JAVA_HOME/jre/lib/security/java.security
    cd  $JAVA_HOME/jre/lib/security
    cp ./policy/unlimited/*jar ./

}

mkdir -p "$LOCALDIR"

install_krb5_conf
get_security_files

# Skip
#install_jce


