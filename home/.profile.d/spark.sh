SPARK_HOME=/usr/local/spark
if [ -s $SPARK_HOME ]; then
    export SPARK_HOME
    PATH=$PATH:$SPARK_HOME/bin
fi

