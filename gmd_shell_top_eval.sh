#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
# batch number column-width time-between-samples
top -b -n 1 -w 96 -d 2 | ~/.conky/gmd/./shell_top_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval