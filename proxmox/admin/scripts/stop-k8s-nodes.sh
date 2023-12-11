#!/bin/bash

qm list
for i in 9901 9902 9903 9904 9905; do
    qm shutdown $i || qm stop $i
done
qm list

	 
