#!/bin/bash

# Goal:
#   Put all files in the local dir into subdirs, where
#   each subdir is named for the (modification) date of the file.

# Purpose: help sort things like a desktop full of screen captures.

# Credit:
#   https://unix.stackexchange.com/questions/683425/how-to-move-files-into-subdirectories-segregated-by-date
#   This is not efficient, since it runs mkdir for each file, but it is easily maintainable.

for file in *; do
    [ ! -L "$file" ] &&
      dir_name=$(date -r "$file" +%Y-%m-%d) &&
      mkdir -p "$dir_name" &&
      mv -- "$file" "$dir_name"
done


