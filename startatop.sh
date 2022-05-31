#!/bin/bash

cd ~
killall conky

~/.conky/gmd/killgmdshell.sh
~/.conky/gmd/killgmdnode.sh

sleep 2s
#watch -n 60 ~/.conky/gmd/atop_maint.sh &> /dev/null &
conky -c ~/.config/conky/Saiph/Saiph.conf &> /dev/null &
conky -c ~/.config/conky/Saiph/Saiph2.conf &> /dev/null &
#conky -c ~/.conky/gmd/'gmd_process_panel_ps' &> /dev/null
#conky -c ~/.conky/gmd/'gmd_process_panel_top' &> /dev/null
#conky -c ~/.conky/gmd/'gmd_process_panel_shell_eval' &> /dev/null
#conky -c ~/.conky/gmd/'gmd_process_panel_shell_top_eval'
conky -c ~/.conky/gmd/'gmd_process_panel_shell_below_eval'
#~/.conky/gmd/startgmdatop.sh
#conky -c ~/.conky/gmd/'gmd_process_panel_shell_atop_eval'

#v v Default is 114 for me
# COLUMNS_CACHE = $COLUMNS 
# COLUMNS=150
# top -o %MEM -b -n 1 > /.
# COLUMNS=COLUMNS_CACHE
# node ~/.conky/gmd/gmd.js /.
