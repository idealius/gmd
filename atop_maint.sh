#!/bin/bash

#This is because atop's reading interface 
#This also exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
# below dump process -b now -f cpu -f mem -f comm --raw --disable-title | ~/.conky/gmd/./shell_below_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval


interval_in_secs=5
total_time_in_secs=86400 #86400 is a day
times=$(calc \($total_time_in_secs+$interval_in_secs\)/$interval_in_secs)
rm /var/tmp/atop.red && atop -a -w /var/tmp/atop.red $interval_in_secs $times