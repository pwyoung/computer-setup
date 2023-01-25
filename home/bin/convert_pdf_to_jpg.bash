#!/usr/bin/env bash

# GOAL: run something like this on all PDF files in the dir
# vips copy test.pdf[dpi=600] test.600dpi.jpg
for i in ./*PDF; do
    #echo $i
    F=`echo $i | perl -pe 's/(.*?).PDF/$1/'`
    #echo $F
    vips copy ${F}.PDF[dpi=600] ${F}.JPG
done
