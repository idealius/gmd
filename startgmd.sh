#!/bin/bash

./killgmd.sh

#END
sleep 2s

conky -c ~/.conky/gmd/'gmd_process_panel'
# &> /dev/null