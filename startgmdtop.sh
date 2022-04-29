#!/bin/bash

./killgmdtop.sh

#END
sleep 2s

conky -c ~/.conky/gmd/'gmd_process_panel_top'
# &> /dev/null
