### GMD
Group Monitoring Display?
Genuinely Mini Display?

Whatever the original name of this project was when it started, it has been lost to the ether. Let's just call it:

### Goodwill Magic Didgeridoo
(or, just "gmd")

Linux Desktop Conky process resource monitoring desktop panel with cpu (%) and mem totals (in MB.) It can use Node.js. Defaults to an awk shell version for speed. Currently, to install this one needs to be familiar with Conky and Linux shell at a minimum.

A cropped version of it running on the Desktop looks like this:

![Output sample](https://github.com/idealius/gmd/raw/working/demo.webm)

This project allowed me to gain experience with nodejs on the Linux command line, writing code to improve execution speed, considerations about different sorting methods, and gain familiarity with some of the Linux base code.

I also wrote it because I have 2008 iMac I wanted to repurpose running LinuxMint, resource monitoring is very useful for making sure it is running smoothly, and there seemed to be a gap in a Linux Desktop process-monitoring-widget space that groups same name processes for popular apps that make extensive use of separate processes like Microsoft's VSCode.

It also was made to have:

1. Low system resources cost
2. After gaining familiarity with it, it is easily customizable


Would be nice to have features:

1. Installation and usage documentation
2. Used it's own totals instead of Conky's
