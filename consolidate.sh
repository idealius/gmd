#!/bin/bash
awk '{ seen[$1] += $2 } END { for (i in seen) print i, seen[i] }'
