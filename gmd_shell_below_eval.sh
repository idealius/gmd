#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
# batch number column-width time-between-samples
below dump process -b now -f cpu -f mem -f comm --raw --disable-title | ~/.conky/gmd/./shell_below_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval
# top -b -n 1 -w 96 -d 2 | ~/.conky/gmd/./shell_top_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval