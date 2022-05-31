#!/bin/bash

./killgmdtopps.sh
sudo systemctl disable below
sudo systemctl enable atop
sleep 2s
sudo systemctl stop below
sudo systemctl start atop
conky -c ~/.conky/gmd/'gmd_process_panel_shell_atop_eval'&

