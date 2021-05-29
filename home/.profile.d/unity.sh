alias u='cd ~/unity; ./UnityHub.AppImage'
alias unity='cd ~/unity; ./UnityHub.AppImage'

# Remember some useful things and make them useful as aliases
if uname | grep Linux; then
    alias _unity_cli='/home/pwyoung/Unity/Hub/Editor/2020.3.10f1/Editor/Unity'
    alias _unity_log='cat /home/pwyoung/.config/unity3d/Editor.log'
    alias _unity_cd_project='cd /home/pwyoung/.local/share/unity3d/Asset\ Store-5.x/Unity\ Technologies/Project'
fi
