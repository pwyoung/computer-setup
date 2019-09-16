#!/bin/sh

# Show repos as a list. Don't rely on auth/cert working
wget -q -O - http://docker.io.lab/v2/_catalog --no-check-certificate  | jq -r .repositories[]
