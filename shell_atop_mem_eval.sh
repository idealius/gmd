#!/bin/bash

# No process labels or self sort, but here is an awk one-liner that does collapse duplicate processes:
# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

# AWK script for Linux Rust program "below" which is a system resource monitor like top (except "below" is faster for this.)
# Leo Idler 5/9/2022
# Notes: may want to switch sorting algo so we can bail out early during the sort.
 awk '
    BEGIN { #header
        column[1] = "RAM Memory"
        MAXLINES = 5
        MAXLINES --
    }

    NR > 0 { #Our classic awk loop is used to figure out which names are duplicates this number is skipping the column headers
        seen_one[$1] += $2; #numeric sum, notice the $3, so this is more like array[fv] = fv instead of array[i] = fv
        dupe[$1] ++     #duplicate process count per process
    } 
    
    END { #now the fun begins
        row = 0
        # for (k=1; k<=NF; k++) print column[k] #field/column labels
        for (f in seen_one) {
            col_one[row] = sprintf("%12.2f", seen_one[f] / 1000) #sprintf for the decimal precision after we convert to MB, right-click procmons column headers for resident size for comparison
 
            if (dupe[f] < 2) {
                col_name[row] = f
            }
            else {
                col_name[row] = f (":(") dupe[f] (")")
            }
            row ++
        }
        if (row > 0) row --

        qsort(col_one, 0, row, col_name)

        my_output[0]="\n${color white}" column[1] "${color EAEAEA}${alignr}${mem}\n${membar 10,}"
        
        if (row > MAXLINES) stop = row - MAXLINES
        else stop = 0

        k = 1
        for (i=row;i>=stop;i--) {
            my_output[k] = col_name[i] " $alignr " col_one[i] " MB"
            k++
        }
        
        #.redeval
        for (i=0;i<k;i++) {
            print my_output[i] >> "/var/tmp/.redeval"
        }
    }
    
    function arr_len(a, i, k) {
        k = 0
        for(i in a) k++
        return k
    }

    # qsort- sort A[left .. right] by quicksort
    # Taken from The AWK Programming Language 1988

    function qsort(A,left,right,B,   i,last) {        
        if (left >= right) # do nothing if array contains
            return          # less than two elements
        swap(A, left, left+ int((right-left+1)*rand()), B)
        last = left # A[left] is now partition element

        for (i = left+1; i <= right; i++)
            if (A[i] < A[left]) {
                swap(A, ++last, i, B)
            }
        swap(A, left, last, B)
        qsort(A, left, last-1, B)
        qsort(A, last+1, right, B)
    }

    function swap(A,i,j,B,   t) {
        t = A[i]; A[i] = A[j]; A[j] = t
        t = B[i]; B[i] = B[j]; B[j] = t
    }
'