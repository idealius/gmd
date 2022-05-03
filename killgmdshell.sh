#!/bin/bash
# echo '\$1 \$2' just a test
cd ~
pkill -f gmd_process_panel_shell
pkill -f pscpu
pkill -f psmem
pkill -f psfile.sh
pkill -f consolidate.sh