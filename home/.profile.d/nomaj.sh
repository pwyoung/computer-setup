L=/tmp/nomaj-setup.txt
echo "start: `date`" > $L

NOMAJ_HOME=$HOME/git/nomaj
if [ -e $NOMAJ_HOME ]; then
    export PATH=$PATH:$NOMAJ_HOME
    echo "Found nomaj. Set PATH=$PATH" >> $L
fi
echo "end: `date`" >> $L


