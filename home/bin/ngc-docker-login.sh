#!/bin/bash

cat ~/.private/ngc-key.txt | docker login nvcr.io -u '$oauthtoken' --password-stdin
