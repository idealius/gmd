#!/bin/bash
#Should work for top or ps
cd ~
killall conky
pkill -f gmd_process_panel_top
pkill -f gmdcache
pkill -f gmd.js
