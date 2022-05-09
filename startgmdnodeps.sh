#!/bin/bash

./killgmdtopps.sh

#END
sleep 2s

conky -c ~/.conky/gmd/'gmd_process_panel_ps'
# &> /dev/null
