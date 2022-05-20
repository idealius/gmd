#!/bin/bash

# No process labels or self sort, but here is an awk one-liner that does collapse duplicate processes:
# awk '{ seen[$1] += $2; dupe[$1] ++ } END { for (i in seen) { if (dupe[i] < 2) { print i, seen[i] } else { print i (":(") dupe[i] (")"), seen[i] } } }'

# AWK script for extracting process information from atop, using it as a dameon (e.g. atop -w /var/tmp/atop.raw 5 60 )
# Leo Idler 5/9/2022
# Notes: may want to switch sorting algo so we can bail out early during the sort.



    #   time_min = $(cut -c4-5<date+"%T")
    #   col_min = $(cut -c4-5<$11)
    #     if ( time_min - col_min > 10 ) {
    #         print WHHOAOAHOKA
    #         print col_min
    #     } 


 awk '
    BEGIN {
        row = 1
    }
    
    NR > 0 {
        if ($20 == "y") {
            row_name[row] = $8 #name
            row_data[row] = $16 #cpu
            row ++
        }

        if ($1=="SEP") {
            sep1 = sep2
            sep2 = eof_sep
            eof_sep = NR
        }
    }

    END {
        # print sep1
        # print sep2
        # print eof_sep
        for (i=0;i<row;i++) {
            print row_name[i], row_data[i]
        }

    }
 '


#  awk '
#     NR == 1 { #header
#         # for (k=1; k<=NF; k++) column[k] = $k 
#         column[1] = "CPU Average"
#         column[2] = "RAM Memory"
#         MAXLINES = 5
#     }

#     NR > 0 { #Our classic awk loop is used to figure out which names are duplicates this number is skipping the column headers
#         seen_one[$3] += $1; #numeric sum, notice the $3, so this is more like array[fv] = fv instead of array[i] = fv
#         seen_two[$3] += $2;
    
#         # seen_two[$3] += $2
#         dupe[$3] ++     #duplicate process count per process
#     } 
    
#     END { #now the fun begins
#         row = 0
#         # for (k=1; k<=NF; k++) print column[k] #field/column labels
#         for (f in seen_one) {
#             col_one[row] = sprintf("%3.1f", seen_one[f]) #sprintf for the decimal precision
#             col_two[row] = sprintf("%12.2f", seen_two[f] / 1000000) #sprintf for the decimal precision after we convert to MB, right-click procmons column headers for resident size for comparison

#             if (dupe[f] < 2) {
#                 # my_arr[row] = f " " flds[1]
#                 col_name[row] = f
#                 col_name_clone[row] = f
#                 # my_arr_clone[row] = my_arr[row]   #we need a matching array of full rows for each sort later which is done by the column
#             }
#             else {
#                 col_name[row] = f (":(") dupe[f] (")")
#                 col_name_clone[row] = col_name[row]
#                 # my_arr[row] =  col_name[row] " " flds[2]
#                 # my_arr_clone[row] = my_arr[row]
#             }
#             row ++
#         }
#         if (row > 0) row --


#         # for (i=row;i>=0;i--) {
#         #     print col_name[i], col_one[i], col_two[i]
#         # }
#         # print "\n"
#         qsort(col_one, 0, row, col_name)
#         qsort(col_two, 0, row, col_name_clone)

#         # for (i=row;i>=0;i--) {
#         #     print col_name[i], col_one[i], col_two[i]
#         # }

#         my_output[0]="${color white}" column[1] "${color EAEAEA}${alignr}${cpu cpu0}%\n${cpubar cpu0 10,}"
        
#         if (row > MAXLINES) stop = row - MAXLINES
#         else stop = 0

#         k = 1
#         for (i=row;i>=stop;i--) {
#             my_output[k] = col_name[i] " $alignr " col_one[i] "%"
#             k++
#         }
#         my_output[k] = "\n${color white}" column[2] "${color EAEAEA}${alignr}${mem}\n${membar 10,}"
#         k++

#         for (i=row;i>=stop;i--) {
#             my_output[k] = col_name_clone[i] " $alignr " col_two[i] " MB"
#             k++
#         }

#         #.redeval
#         for (i=0;i<arr_len(my_output);i++) {
#             print my_output[i] > "/var/tmp/.redeval"
#             # print my_output[i] > "/var/tmp/.redeval"
#         }
#     }
    
#     function arr_len(a, i, k) {
#         k = 0
#         for(i in a) k++
#         return k
#     }

#     # qsort- sort A[left .. right] by quicksort
#     # Taken from The AWK Programming Language 1988

#     function qsort(A,left,right,B,   i,last) {        
#         if (left >= right) # do nothing if array contains
#             return          # less than two elements
#         swap(A, left, left+ int((right-left+1)*rand()), B)
#         last = left # A[left] is now partition element

#         for (i = left+1; i <= right; i++)
#             if (A[i] < A[left]) {
#                 swap(A, ++last, i, B)
#             }
#         swap(A, left, last, B)
#         qsort(A, left, last-1, B)
#         qsort(A, last+1, right, B)
#     }

#     function swap(A,i,j,B,   t) {
#         t = A[i]; A[i] = A[j]; A[j] = t
#         t = B[i]; B[i] = B[j]; B[j] = t
#     }
# '