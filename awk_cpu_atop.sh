#!/bin/bash

# No process labels or self sort, but here is an awk one-liner that does collapse duplicate processes:
# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

# AWK script for extracting process information from atop, using it as a dameon (e.g. atop -w /var/tmp/atop.raw 5 60 )
# Leo Idler 5/9/2022
# Notes: may want to switch sorting algo so we can bail out early during the sort.

 awk '
    BEGIN {
        row = 1
        sep2 = 0
        eof_sep = 0
    }
    
    {
        if ($20 == "y") {
            #I guess we had to use regex at some point, this removes those pesky parentheses:
            row_name[row] = gensub(/["()"]/, "", "g", $8) #name
            row_data[row] = gensub(/["()"]/, "", "g", $12) #cpu
            row ++
        }

        if ($1=="SEP") {
            sep1 = sep2
            sep2 = eof_sep
            eof_sep = row
        }
    }

    END {
        # print sep1
        # print sep2
        # print eof_sep
        for (i=sep2;i<row;i++) {
            print row_name[i], row_data[i]
        }

    }
 '

