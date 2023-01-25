#!/bin/bash

for i in *pdf *PDF; do
    n="$i.txt"
    pdftotext -layout "$i" "$n"
done
