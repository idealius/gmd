--Since commenting doesn't appear to work with conky's lua files I'm just using this as a scratchpad
${execi 1 COLUMNS_CACHE=$COLUMNS & COLUMNS=200 & top -o %MEM -b -n 1 > gmdcache & COLUMNS=$COLUMNS_CACHE}
${execi 1 node ~/.conky/gmd/gmd.js ./}
node ~/.conky/gmd/gmd.js ./
${execi 1 dirname $PWD}