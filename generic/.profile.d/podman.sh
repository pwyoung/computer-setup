if command -v podman >/dev/null; then
    alias docker='podman'
fi

if command -v podman-compose >/dev/null; then
    alias docker-compose='podman-compose'
fi
