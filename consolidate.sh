#!/bin/bash

#1. Just collapses/ consolidates duplicate process names + 1 column of data:
#awk '{ seen[$1] += $2 } END { for (i in seen) print i, seen[i] }'

#2. Same as one but also labels number of process duplicates in process name:
awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

