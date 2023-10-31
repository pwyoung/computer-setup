# For Windows, I've decided to just use WSL(2) and Docker-Desktop
# Running VMs seems like a PITA now.

# Install Docker Desktop (backed by WSL rather than Hyper-V)
Open https://docs.docker.com/desktop/install/windows-install/

# Install VSCode
Open https://code.visualstudio.com/docs/?dv=win
# Check that we can run the app from the Linux distro
# Create a new Ubuntu shell and check that code is in $PATH
```
which code
```
/mnt/c/Users/philw/AppData/Local/Programs/Microsoft VS Code/bin/code

# Setup WSL2 with Docker and Nvidia-GPU Support
## Clone repo
###   https://github.com/pwyoung/computer-setup
```
cd ~/git
git clone https://github.com/pwyoung/computer-setup
```
## Run the script
###   https://github.com/pwyoung/computer-setup/blob/master/home/bin/setup-windows-computer.sh
```
cd ~/git/computer-setup/blob/master/home/bin
./setup-windows-computer.sh
```

