#!/bin/bash

# Kill all stopped containers
sudo docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs sudo docker rm

# Remove dangling images
docker images -q --filter dangling=true | xargs docker rmi
