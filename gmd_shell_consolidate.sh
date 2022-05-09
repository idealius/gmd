#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display
#      columns  | rem 1st row | collapse dupe procs /w sum | sort by 2nd column > file output
ps axo comm,rss | sed '1d' | ~/.conky/gmd/./consolidate.sh | sort -g -r -k2,2 > /var/tmp/.redmemshell
ps axo comm,pcpu | sed '1d' | ~/.conky/gmd/./consolidate.sh | sort -g -r -k2,2 > /var/tmp/.redcpushell
cp /var/tmp/.red*shell ~/.conky/gmd/

#Try it if you don't believe me: =)
# ps axo comm,rss | sed '1d' | ~/.conky/gmd/./consolidate.sh | sort -g -r -k2,2 > ~/.conky/gmd/.redmemshell
# ps axo comm,pcpu | sed '1d' | ~/.conky/gmd/./consolidate.sh | sort -g -r -k2,2 > ~/.conky/gmd/.redcpushell