#!/bin/bash

#This mainly exists because the cp command acts as a "file finished writing" contingency
#otherwise there is a chance of spotty display

ps axo pcpu,rss,comm | ~/.conky/gmd/./shell_eval.sh && cp /var/tmp/.redeval ~/.conky/gmd/.redeval