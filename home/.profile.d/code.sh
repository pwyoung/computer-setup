# Run VSCode from the flatpak

FP=com.visualstudio.code

if which flatpak >>/dev/null; then
    if flatpak info $FP >>/dev/null; then
        alias code="flatpak run $FP"
    fi
fi
