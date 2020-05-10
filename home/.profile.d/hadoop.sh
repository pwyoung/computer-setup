HADOOP_HOME=/usr/local/hadoop
if [ -s $HADOOP_HOME ]; then
    export HADOOP_HOME
    PATH=$PATH:$HADOOP_HOME/bin
fi

