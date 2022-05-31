#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
# below dump process -b now -f cpu -f mem -f comm --raw --disable-title | ~/.conky/gmd/./shell_below_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval
myclocktime=$(date +"%T")
atop -PPRC -r /var/tmp/atop.red -b $myclocktime | ~/.conky/gmd/awk_cpu_atop.sh | ~/.conky/gmd/shell_atop_cpu_eval.sh && #PPRC = CPU in atop-land
atop -PPRM -r /var/tmp/atop.red -b $myclocktime | ~/.conky/gmd/awk_mem_atop.sh | ~/.conky/gmd/shell_atop_mem_eval.sh &&#PPRM = MEM
cp /var/tmp/.redeval ~/.conky/gmd/.redeval
# rm /var/tmp/atop.raw

# top -b -n 1 -w 96 -d 2 | ~/.conky/gmd/shell_top_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval