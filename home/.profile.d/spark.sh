#!/bin/bash

################################################################################
# SPARK SETUP
################################################################################
# RESOURCES
#   https://spark.apache.org/downloads.html
#   https://medium.com/big-data-engineering/how-to-install-apache-spark-2-x-in-your-pc-e2047246ffc3

# Test
# cd $SPARK_HOME
#   Cygwin:
#     ./bin/run-example.cmd SparkPi 10
#   Ubuntu
#     ./bin/run-example SparkPi 10

# SDKMAN
#   source "/home/pwyoung/.sdkman/bin/sdkman-init.sh"
#   sdk list spark
#   sdk install spark 3.0.2
#   Which hadoop libs does it have (none, 2.x, or 3.x)?


# ln -s /c/spark-2.4.5-bin-hadoop2.7 /spark
# Also, this avoids having spaces in path names (e.g. on Cygwin)
if [ -d /spark ]; then
    export SPARK_HOME=/spark
fi
if [ ! -z "$SPARK_HOME" ]; then
    echo "SPARK_HOME is $SPARK_HOME"
    PATH=$SPARK_HOME/bin:$PATH
fi

# Spark on windows wants HADOOP_HOME set
D1="C:\winutils"
D2=/c/winutils
if [ -d $D1 ]; then
    export HADOOP_HOME=$D1
elif [ -d $D2 ]; then
    export HADOOP_HOME=$D2
fi
if [ ! -z "$HADOOP_HOME" ]; then
    echo "HADOOP_HOME is $HADOOP_HOME"
    PATH=$PATH:$HADOOP_HOME/bin
fi

# TEST SPARK LOCAL (NATIVE BINARIES)
#   cd /spark
#   time ./bin/spark-submit   --class org.apache.spark.examples.SparkPi   --master local[8]  /spark/examples/jars/spark-examples_2.12-3.0.2.jar   100
#   7.8s
#
# TEST SPARK LOCAL (ON DOCKER)
#   git clone https://github.com/big-data-europe/docker-spark.git
#   docker-compose up
#   time ./bin/spark-submit   --class org.apache.spark.examples.SparkPi   --master spark://localhost:7077 /spark/examples/jars/spark-examples_2.12-3.0.2.jar   100
#   9.7s

# Spark History (requires an optional service and for apps to specify the log dir)
#   https://spark.apache.org/docs/latest/monitoring.html
#   https://www.back2code.me/2018/11/spark-history-server-available-in-docker-spark/

