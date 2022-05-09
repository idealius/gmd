#!/bin/bash

echo NODE PS
time node ~/.conky/gmd/gmd.js ~/.conky/gmd/ -ps

echo
echo SHELL
time ~/.conky/gmd/./gmdshell_eval.sh
