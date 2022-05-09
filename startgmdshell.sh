#!/bin/bash

./killgmdshell.sh

#END
sleep 2s

conky -c ~/.conky/gmd/'gmd_process_panel_shell'
# &> /dev/null