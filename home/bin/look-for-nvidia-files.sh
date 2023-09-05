# Show files owned by Nvidia packages that are installed on this system
rm /tmp/x; for i in $(sudo apt list --installed 2>/dev/null| grep nvidia | grep jammy | cut -d'/' -f 1); do echo $i; dpkg -L $i |tee -a /tmp/x; done
emacs /tmp/x
