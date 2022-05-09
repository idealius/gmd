#!/bin/bash
#Should work for top or ps
cd ~
killall conky
pkill -f gmd_process_panel_top
pkill -f gmd_process_panel_shell
pkill -f gmd_process_panel_shell_eval
pkill -f gmd_process_panel_node
pkill -f gmd_process_panel_node_ps
pkill -f gmd_process_panel_node_ps_eval
pkill -f gmdcache
pkill -f gmd.js
