#!/bin/bash
# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

 awk '
    NR == 1 { #header
        row = 1
        for (k=1; k<=NF; k++) column[k] = $k
    }

    NR > 1 { #For skipping header
        seen[$1] += $2; #numeric sum, notice the $1, so this is more like array[fieldvalue] = fv instead of array[i] = fv
        dupe[$1] ++     #duplicate process count per process
        row ++
    } 
    
    END {
        hsort(seen, NR)
        for (k=1; k<=NF; k++) print column[k]
        for (i in seen) {
            if (dupe[i] < 2) {
                print i, seen[i]
                }
            else {
                print i (":(") dupe[i] (")"), seen[i]
            }
            # print A[i]
        }
    }
    

    # heapsort
    { A[NR] = $0 }

    END { 
        # hsort(seen, NR)
        # for (i in seen)
        #     { print seen[i] }
    }

    function hsort(A,n, i) {
        for (i = int(n/2); i >= 1; i--)
            { heapify(A, i, n) } 
        for (i = n; i > 1; i--) {
            { swap(A, 1, i) }
            { heapify(A, 1, i-1) }
        }
    }

    function heapify(A,left,right,    p,c) {
        for (p = left; (c = 2*p) <= right; p = c) {
            if (c < right && A[c+1] > A[c])
                { c++ }
            if (A[p] < A[c])
                { swap(A, c, p) }
        }
    }

    function swap(A,i,j,   t) {
        t = A[i]; A[i] = A[j]; A[j] = t
    }
'