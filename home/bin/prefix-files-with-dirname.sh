#!/bin/bash

# Goal:
# Given a set of directories and files like this:
# ./a/some file here.ext
# ./b/some other file here.ext
#
# Convert it to
# ./a/a---somefilehere.ext
# ./b/b---someotherfilehere.ext

for d in *; do
    echo "dir $d"
    pushd $d >/dev/null
    pwd
    for f in *; do
        echo "file $f"
        if ! echo "$f" | grep "$d" >/dev/null; then
            n=`echo "$d---$f" | sed 's/ //g'`
            echo "renaming '$f' to '$n'"
            mv "$f" "$n"
        else
            echo "not renaming file"
        fi
    done
    popd >/dev/null
done
