#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
#      columns  | rem 1st row | collapse dupe procs /w sum | sort by 2nd column > file output
# ps axo comm,rss | sed '1d' | ~/.conky/gmd/consolidate.sh 2 | sort -g -r -k2,2 > /var/tmp/.redmemshell
# ps axo comm,pcpu | sed '1d' | ~/.conky/gmd/consolidate.sh 2 | sort -g -r -k2,2 > /var/tmp/.redcpushell
# cp /var/tmp/.ps* ./

# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

awk '
    NR == 1 {
        for (k=1; k<=NF; k++) column[k] = $k
    }

    NR > 1 { 
        seen[$1] += $2; #numeric sum
        dupe[$1] ++     #duplicate process count per process
    } 
    
    END {
        for (k=1; k<=NF; k++) print column[k]
        for (i in seen) {
            if (dupe[i] < 2) {
                print i, seen[i]
                }
            else {
                print i (":(") dupe[i] (")"), seen[i]
            }
        }
    }'