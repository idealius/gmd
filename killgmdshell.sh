#!/bin/bash
# echo '\$1 \$2' just a test
cd ~
pkill -f gmd_process_panel_shell
pkill -f gmd_process_panel_shell_eval
pkill -f pscpu
pkill -f psmem
pkill -f gmdshell.sh
pkill -f shell_eval.sh
pkill -f gmd_shell_eval.sh
pkill -f consolidate.sh
pkill -f gmd_shell_eval.sh
pkill -f gmd_shell_consolidate.sh
pkill -f gmd_process_panel_shell_atop_eval
pkill -f gmd_shell_atop_eval.sh
pkill -f atop
