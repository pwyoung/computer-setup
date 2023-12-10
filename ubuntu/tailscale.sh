#!/bin/bash

#resolvectl --no-pager | grep '100.100.100.100'
resolvectl --no-pager | grep -i 'current' | grep -i 'dns'



