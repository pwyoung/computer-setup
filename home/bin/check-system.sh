#!/bin/bash

systemctl status --no-pager | head -2 | tail -1

systemctl --failed

