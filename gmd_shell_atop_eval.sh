#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
# below dump process -b now -f cpu -f mem -f comm --raw --disable-title | ~/.conky/gmd/./shell_below_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval
mydate=$(date +"%T")
cd ~/.conky/gmd
atop -PPRC -r /var/tmp/atop.raw -b $mydate | ./awk_cpu_atop.sh | ./shell_atop_cpu_eval.sh && #PPRC = CPU in atop-land
atop -PPRM -r /var/tmp/atop.raw -b $mydate | ./awk_mem_atop.sh | ./shell_atop_mem_eval.sh &&#PPRM = MEM
cp /var/tmp/.redeval ~/.conky/gmd/.redeval

# top -b -n 1 -w 96 -d 2 | ~/.conky/gmd/./shell_top_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval