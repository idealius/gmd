#!/bin/bash

./killgmdtopps.sh
sudo systemctl disable atop
sudo systemctl enable below
sleep 2s
sudo systemctl stop atop
sudo systemctl start below
conky -c ~/.conky/gmd/'gmd_process_panel_shell_below_eval'&

