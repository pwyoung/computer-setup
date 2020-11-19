echo "Set up nomaj"
NOMAJ_HOME=/home/$USER/git/nomaj
if [ -e $NOMAJ_HOME ]; then
    export PATH=$PATH:$NOMAJ_HOME
fi

