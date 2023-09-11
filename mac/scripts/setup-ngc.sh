
Run  curl -O https://ngc.nvidia.com/downloads/ngccli_mac.zip && unzip ngccli_mac.zip && chmod u+x ngc

mv ./ngc ~/bin-local/ngc

ngc config current | grep '*****' || cat <<EOF
Log into NGC.

See:
  https://ngc.nvidia.com/setup
  https://stackoverflow.com/questions/70970424/docker-build-docker-compose-up-error-unknown-desc-failed-to-fetch-anonymous
EOF
