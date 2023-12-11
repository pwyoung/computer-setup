#!/bin/bash

qm list
for i in 9901 9902 9903 9904 9905; do
    qm start $i
done
qm list

	 
