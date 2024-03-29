### GMD
Gregarious Monitoring Display?
Genuinely Mini Display?

Whatever the original name of this project was when it started, it has been lost to the ether. Let's just call it:

### Goodwill Magic Didgeridoo
(or, just "gmd")

Linux Desktop Conky(https://github.com/brndnmtthws/conky) process resource monitoring desktop panel with CPU (%) and memory totals (in MB.) In very simple terms, it allows you conveniently monitor apps which might slow down your Linux system. It can use Node.js as an interface to ps or top, or using awk it can interface to below (very similar to atop located here: https://github.com/facebookincubator/below it was designed by Meta OpenSource, a Facebook open source group giving back to the community: https://opensource.fb.com)  Defaults to an awk shell version using 'below' for speed. Currently, to install this one needs to be familiar with Conky and Linux shell at a minimum.

A cropped version of it running on the Desktop looks like this:

![Output sample](https://github.com/idealius/gmd/raw/main/demo2.webp)

*Notice the :(x) after the process name indicating x number of processes and their total in the CPU or MEM column. This is the difference between regular conky process displays and displays using gmd*

This project allowed me to gain experience with nodejs on the Linux command line, writing code to improve execution speed, considerations about different sorting methods, and gain familiarity with some of the Linux base code.

I also wrote it because I have 2008 iMac I wanted to repurpose running LinuxMint, resource monitoring is very useful for making sure it is running smoothly.

But, when I looked, I found there was a gap in the Linux Desktop process-monitoring-widget space which groups or "collapses" same name processes. This wasn't much of an issue 10 or 20 years ago, but now it is with Chrome and VSCode regularly making new processes for extenstions, tabs, etc.

It also was made to have:

1. Low system resources cost
2. After gaining familiarity with it, it is easily customizable

Would be nice to have features:

1. Normally, I wouldn't ever think about publishing this publically without minimum installation and usage documentation, but for now this readme.md serves as a stand-in. 
2. Had an option to use it's own totals instead of Conky's
