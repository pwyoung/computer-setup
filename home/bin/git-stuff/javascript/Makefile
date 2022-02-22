.PHONY=all run

# Force make to run targets sequentially
.NOTPARALLEL:

# Directory containing this makefile. Includes trailing /
MAKEFILE_PATH=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))

# Set default shell as bash
SHELL:=/bin/bash

all: 
	node ./get-github-repos.js

deps:
	npm --version || sudo apt install npm
	npm install octokit

run: deps
	node ./get-github-repos.js
