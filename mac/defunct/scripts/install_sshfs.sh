MY_PATH=$( cd $(dirname "$0") && pwd )
source ${MY_PATH}/utils.sh # brew_install etc.

brew_cask_install osxfuse
brew_install sshfs
