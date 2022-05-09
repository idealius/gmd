#!/bin/bash
# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

 awk '
    NR == 1 { #header
        for (k=1; k<=NF; k++) column[k] = $k
    }

    NR > 1 { #For skipping header
        seen[$1] += $2; #numeric sum, notice the $1, so this is more like array[fieldvalue] = fv instead of array[i] = fv
        dupe[$1] ++     #duplicate process count per process
    } 
    
    END { 
        row = 0
        for (k=1; k<=NF; k++) print column[k] #field/column labels
        for (f in seen) {
            if (dupe[f] < 2) {
                my_arr[row] = f " " seen[f]
                col[row] = seen[f]
                }
            else {
                my_arr[row] =  f (":(") dupe[f] (")") " " seen[f]
                col[row] = seen[f]
            }
            row ++
        }
        //arr to sort by * length of arrays * additional array to mirror original arr order
        if (row > 0) row --
        
        hsort(col, row, my_arr)

        for (i=row;i>0;i--) {
            print my_arr[i]
        }
    }
    
    function arr_len(a, i, k) {
        k = 0
        for(i in a) k++
        return k
    }


    function hsort(A,n,B, i) {
        for (i = int(n/2); i >= 1; i--)
            { heapify(A, i, n, B) } 
        for (i = n; i > 1; i--) {
            { swap(A, 1, i, B) }
            { heapify(A, 1, i-1, B) }
        }
    }

    function heapify(A,left,right,B,    p,c) {
        for (p = left; (c = 2*p) <= right; p = c) {
            if (c < right && A[c+1] > A[c])
                { c++ }
            if (A[p] < A[c])
                { swap(A, c, p, B) }
        }
    }

    function swap(A,i,j,B,   t) {
        t = A[i]; A[i] = A[j]; A[j] = t
        t = B[i]; B[i] = B[j]; B[j] = t
    }
'