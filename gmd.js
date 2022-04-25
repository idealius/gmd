/* LICENSE
    You put my github https://github.com/idealius somwhere in your docs or code then cool =)
*/


/* Purpose

Make easy to read output files containing totals for current CPU and MEM usage ostensibly used for Conky.

*/



/* Usage //x needs update

gmd folder
//export topmem and topcpu to destination folder

gmd
//print to std out thru inform

gmd -1
//both, saved to ./topmem and topcpu

*/

'use strict'
const { strictEqual } = require('assert')
const { isNullOrUndefined } = require('util')
const { exit } = require('process')

var DEBUG = false //not your compiler's debug

var INFORM_VERBOSE = true //Really shouldn't change this. console logging enabled, then alias 'inform' below
var error_log = ""
var inform_log = ""

var shell = require('child_process')
var myfile = require('fs')
var mode = 1
var destdir = "File unsaved for: "
var top_data
var my_name_data = []
var my_cpu_data = []
var my_mem_data = []
var output_success = true

//This a file piped from top we parse as our only initial data set
var gmd_cache_path = "gmdcache"
var file_retries = 100

const myargs = process.argv.slice(2) //remove file location columns 'node', './'


var my_write_file = function(filename, data, retries) {
    var i = 0
    while (i < retries) {
        myfile.writeFileSync(filename, data)
        if (!myfile.existsSync(filename)) i++
        else return true
    }
}

var my_read_file = function(filename, retries) {
    var err_track = "" //I'm not sure (err) below is accessible at this level of scope hence this var
    while (i < retries) {
        try {
            // vv   -o %MEM is more for preference and changes little except for a bit of 'pre-sort' by memory usage
            // var data = myfile.readFileSync(filename, {encoding:'utf8'})
            var data = myfile.readFileSync(filename, {encoding:'utf8'})
            return data
        } catch(err) {
            err_track = err
            add_error("Error accessing \'" + filename + "\', error code:" + err)
            i++
            continue
        }
    }
    return err_track
}

var brisk_exit = function(err) {
    // myfile.writeFileSync("gmd_err.log", error_log)
    my_write_file("gmd_err.log", error_log, file_retries)
    if (!INFORM_VERBOSE || DEBUG) my_write_file("gmd.log", inform_log, file_retries)
    process.exit(err)
}


switch (myargs[0]) {
    case undefined:
    case "":
        mode = 0 //print
        console.log("Print mode")
        break
    case "-1":
        mode = -1 //both print and save, but tied down to ./gmdcache for output
        destdir = "./"
        console.log("Print and Save mode")
        break
    case "3": //debug
        mode = 3
        DEBUG = true
        destdir = myargs[0]
        if (destdir[destdir.length-1] != '/') destdir += '/'
        console.log("User supplied file output mode")
        break
    default: //intended usage, and silent
        INFORM_VERBOSE = false
        mode = 1
        destdir = myargs[0]
        if (destdir[destdir.length-1] != '/') destdir += '/'
        //console.log("User supplied file output mode")
        break
}


// 3 types of console.log duplicates:
// add_error() = building disk log
// inform() = user facing logging
// debug() = dev facing

// ERROR
var add_error = function(err) {
    error_log += err + '\n'
    return err
}

// INFORM
try {
    var inform = function(str){
        if (INFORM_VERBOSE) console.log(str)

        if (str[str.length-1] !="\n") str += "\n"
        inform_log += str
    }
}catch (err){
    console.log(add_error("Logging unavailable, Error: " + err));

}
// DEBUG
try {
    if (DEBUG) {
            var debug = console.log.bind(global.console) // debug is going to mimic the bind to global.console
    } 
    else var debug = function(){} //... or go to limbo
}catch (err){
    console.log(add_error("\'Debugging mode\' unavailable, Error: " + err));
}

debug(1)
var columns1 = "COLUMNS_CACHE=$COLUMNS & COLUMNS=100 &"
//var top_cmd = "watch -n 1 top -o %MEM -b -n 1 >" + gmd_cache_path
var top_cmd = "top -o %MEM -b -n 1 > " + gmd_cache_path
var columns2 = " & COLUMNS=$COLUMNS_CACHE"
// shell.exec( columns1 + top_cmd + columns2)
// shell.exec(top_cmd)
var gmd_retries = -1
var err_track = "Error with gmdcache, error couldn't be tracked."

while (gmd_retries < file_retries+1) {
    gmd_retries++
    try {
        // vv   -o %MEM is more for preference and changes little except for a bit of 'pre-sort' by memory usage
        top_data = myfile.readFileSync(gmd_cache_path, {encoding:'utf8'})
        break
    } catch(err) {
        err_track = err
        add_error("Error accessing \'" + gmd_cache_path + "\', error code:" + err)
        continue
    }
    
}
if (top_data === undefined || top_data === null || top_data == "" || top_data.length < 50) {
    add_error("\'null\' gmdcache from \'" + gmd_cache_path + "\'")
    
}
debug(2)

if (gmd_retries >= file_retries) {
    console.log("Exceeded max gmdcache access retries: " + gmd_retries + " at " + gmd_cache_path)
    add_error("Exceeded max gmdcache access retries: " + gmd_retries + " at " + gmd_cache_path)
    brisk_exit(err_track)
}

inform("gmdcache access retries: " + gmd_retries)

debug(top_data) //x
debug(3)

var cache_data = top_data.split("\n")
cache_data = cache_data.splice(7)

//Schema level functions
String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

    //walk backwards for name
for (var i = 0; i < cache_data.length; i++) {
    var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)

    my_name_data.push(cache_string) //dont need second arg for slice apparently 
    //x debug(my_data[i])
}

debug(4)
//Functions:

// 6561 ilius  20   0 1108.7g 369140 259080 S   0.0   9.2   0:13.05 chrome
// Memory is column 10
var extract_column = function(col, source_array) {
    "use strict";

    var a = 0 //index of 'cursor' on begin mem string
    var b = 0 //index of 'cursor' on end mem string
    var x = 0 //column
    

    while (x < col && a < source_array.length) {
        
        //If space here,              and non-space next...
        if (source_array[a] == ' ' && source_array[a+1] != ' ') x++
        
        //Cap it at the end of the loop...
        if (x == col-1) b = source_array.indexOf(' ', a+2)
        //x debug(a, b)
        a++
    }
    var ret = source_array.slice(a, b)
    ret = (ret === null || ret === undefined || isNaN(ret)) ? 0 : ret //x debug
    debug(ret)
    return ret
}


//checks array for duplicate element, returns two vars: .result and .value
var contains = function(search_str, array_str) {
    var a = {
        result: false,
        value: 0
    }

    for (var i = 0; i < array_str.length; i++) { //array level...
        // v we're not interested in trailing chars past our search terms length, this is for proc grouping
        var cut_array = array_str[i].slice(0,search_str.length) //string level...
        if (search_str == cut_array) {
            a.result = true
            a.value = i
            break
        }
    }

    //This double checks there's no '+' before the '('. This doesn't help for processes that have a '+' right
    //there positionally alongside a duplicate process, but with a longer filename. However, it still
    //takes care of the other edge case which is much more common - where the + is for long process filenames)
    if (a.result) {
        var i = a.value 
        var start_pos = array_str[i].length //str level
        var parenth_pos = array_str[i].indexOf('(', i)
        start_pos = (parenth_pos > 0) ? parenth_pos : start_pos
        if (array_str[start_pos-1] == '+') a.result = false
    }

    return a
}



var decimal_round = function(num, prec) {
    //debug(num)
    if (num == parseInt(num)) return num //not even a decimal
    var num_str = num.toString()
    var dec = 0
    prec++
    
    while (num_str[dec] != '.' && dec < num_str.length) dec++ //find decimal point position


    if (dec + prec >= num_str.length) return parseFloat(num_str) //decimal not long enough anyway / no trailing digit

    var last_digit = parseInt(num_str[dec + prec - 1])
    var trailing_digit = parseInt(num_str[dec + prec])

    if (trailing_digit > 4) { // >4 we round up
        last_digit = (last_digit < 9) ? last_digit++ : 0
        
        var digit = dec + prec - 2
        if (num_str[digit] == 9) {
            num_str.replaceAt(digit, 0) //raise 9 to 0
            while (digit >= 0) {
                digit--
                if (parseInt(num_str[digit]) == 9) num_str.replaceAt(digit, 0)
                else break
            }
        }
        // num_str[dec + prec] = last_digit // doesn't work    
        num_str.replaceAt(dec + prec, last_digit)
    
    
    }

    num_str = num_str.slice(0, dec + prec)
    return parseFloat(num_str)
}

//Functions END


//Consolidation and collating our data:

var marked_for_deletion = [] //kind of a hacky way to do this part later but w/e

//Main data consolidation loop with details inline:
debug(5)
for (var i = 0; i < cache_data.length; i++) {
    
    var ret = extract_column(6, cache_data[i]) //Memory data
    var extract_mem = decimal_round(parseFloat(ret) / 1000, 2) //Convert to MB ( / 1000) and adjust decimals
    
    ret = extract_column(9, cache_data[i]) //CPU data
    var extract_cpu = decimal_round(parseFloat(ret), 2)

    var tmp_str_array = my_name_data.slice(0, i) // clip array to only search up to our current index
    
    //May as well clean up the bottom of the name list... //x Should refactor this to the readfile stage...
    if (my_name_data[i] == " " || my_name_data[i] == "") {
        marked_for_deletion.push(true)
        continue
    }
    
    var dupe = []
    dupe.push({result:false})
    if (i != 0) { // v We got a duplicate here?
        var dupe = contains(my_name_data[i], tmp_str_array)
        var value = dupe.value
    }
    // else { //bail if it's the first index...
    //     dupe.result = false
    // }

    if (dupe.result) { //"Duplicate" so add up totals...
        
        //BUG Why is this data checking necessary? (starts, here actually we just do it later) v v v BUG
        my_mem_data[value] = (my_mem_data[value] === null || my_mem_data[value] === undefined || isNaN(my_mem_data[value])) ? 0 : my_mem_data[value] 
        my_cpu_data[value] = (my_cpu_data[value] === null || my_cpu_data[value] === undefined || isNaN(my_cpu_data[value])) ? 0 : my_cpu_data[value] 
        
        // debug(':' + value, my_name_data[value], my_mem_data[value], my_cpu_data[value]) //x debug
        //x if (value >= my_mem_data.length) debug("WTF?") //x debug lol
        var my_float = my_mem_data[value] + extract_mem
        my_mem_data[value] = decimal_round(my_float, 2)
        //x debug(my_float)

        my_float = my_cpu_data[value] + extract_cpu
        my_cpu_data[value] = decimal_round(my_float, 2)
        debug('{' + value, my_name_data[value], my_mem_data[value], my_cpu_data[value]) //x debug
        marked_for_deletion.push(true)
        
        //update the process name in the form of a trailing '(x)' where x is the number of duplicate processes
        var length = my_name_data[value].length
        var c = length
        var name = my_name_data[value]
        var close_bracket = false
        var close_brk_pos = 0
        var open_bracket = false
        var open_brk_pos = 0
        while (c > 0) { //Don't think there's going to be an app name with zero characters (taking in account the '(' ...)
            
            if (name[c] == ')' && !close_bracket) {
                close_bracket = true
                close_brk_pos = c
            } if (name[c] == '(' && !open_bracket && close_bracket) { //close_bracket here prevents ')(' detection
                open_bracket = true
                open_brk_pos = c
                break
            }
            c--
        }
        if (open_bracket) {            
            var my_int = parseInt(name.slice(open_brk_pos+1, close_brk_pos))
            my_int++
            my_name_data[value] = name.slice(0, open_brk_pos+1) + my_int.toString() + name.slice(close_brk_pos)
            //x debug(name) //x
        }
        else {
            my_name_data[value] += ":(2)"
        }



    }
    else { //New name, add new rows to our cpu/mem arrays

        my_mem_data.push(extract_mem)
        my_cpu_data.push(extract_cpu)
        marked_for_deletion.push(false)
    }
}

debug(my_name_data,my_mem_data)
debug(6)

//Delete marked in the name array and build our 2 lists
var cache_my_name_data = []
var my_proc_mem_array = []
var my_proc_cpu_array = []
for (var i = 0; i < my_name_data.length; i++) {
    if (!marked_for_deletion[i]) cache_my_name_data.push(my_name_data[i])

}

//slice off the ends of our mem and cpu lists to match the name list
var name_len = my_name_data.length
my_mem_data = my_mem_data.slice(0,name_len)
my_cpu_data = my_cpu_data.slice(0,name_len)


my_name_data = cache_my_name_data
//x debug("LENGTHS:", my_name_data.length, my_mem_data.length)

for (var i = 0; i < my_name_data.length; i++) {
    // debug(':' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
     //x Why is this necessary? v v v
    my_mem_data[i] = (my_mem_data[i] === null || my_mem_data[i] === undefined || isNaN(my_mem_data[i])) ? 0 : my_mem_data[i] 
    my_cpu_data[i] = (my_cpu_data[i] === null || my_cpu_data[i] === undefined || isNaN(my_cpu_data[i])) ? 0 : my_cpu_data[i] 
     
    my_proc_mem_array.push([my_name_data[i], my_mem_data[i]])
    my_proc_cpu_array.push([my_name_data[i], my_cpu_data[i]])
    // debug('.' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
}

// SECTION ------------------------------------------------
// FUNCTIONS


//For deep copying arrays
function nestedCopy(array) {
    return JSON.parse(JSON.stringify(array));
}

//basically a brute force element swapping function that gets around modifying arrays out of scope by deep cloning it first
function arraymove(arr, fromIndex, toIndex) {
    var toIndex_cache = arr[toIndex]
    var fromIndex_cache = arr[fromIndex]
    var replacement = nestedCopy(arr)
    replacement[fromIndex] = toIndex_cache
    replacement[toIndex] = fromIndex_cache
    //x debug("Successfully moved row..")
    return replacement
}

//Sort lists descending from the top-to-bottom by second column
//Over complicated because of my current ignorance on JS array scope management
//Basically, we're looking for a bigger number than us, and if it is we swap places as
//we iterate down - /w restarting the loop, resuming an inner loop, and array cloning when necessary
debug(8)
var my_sort = function (data_array) {
    //x debug(data_array.length)
    var start_over
    var done = false
    var passes = 0
    var shifts = 0
    var cache_array
    var i_start_pos = 0
    debug(9)
    while(!done) {
        start_over = false
        passes++
        for (var i=i_start_pos;i<data_array.length;i++) {
            for (var c=data_array.length-1;c>=0;c--) {
                var oracle = 0
                // oracle = (i - 1 > 0) ? data_array[i-1] : oracle
                oracle = (c - 1 > 0) ? data_array[c-1][1] : oracle
                if (c > i && data_array[c][1] > data_array[i][1] && oracle < data_array[c][1]) {
                    var gc_array = cache_array
                    cache_array = arraymove(data_array, i, c)
                    // gc_array = null //Might help garbage collection (gc)
                    debug("Move from row:", i + " to " + c)
                    start_over = true //without knowing details this is necessary since we're looping and modifying an array at the same time
                    shifts++
                    break
                }
            }
            
            if (start_over) {                               //1. we made a change, we have to start over
                data_array = cache_array
                break
            }
            else if (i == data_array.length-1) done = true  //2. break the loop, we're done
            else
            {                                               //3. if we made it this far we know we're the biggest number for that position
                i_start_pos = i
                debug("Sorted index:", i)
            }
        }
        // debug(data_array)
    }
    debug("Passes:", passes, "Shifts:", shifts)
    
    return cache_array
}

//FUNCTION END

//my_proc_cpu_array.sort()
// my_proc_mem_array.sort(sortFunction);
//x debug(my_proc_cpu_array)
var gc_mem = my_proc_mem_array
var gc_cpu = my_proc_cpu_array
my_proc_mem_array = my_sort(my_proc_mem_array)
my_proc_cpu_array = my_sort(my_proc_cpu_array)
// gc_mem = null //Might help garbage collection (GC)
// gc_cpu = null

//Convert to one big string with '\n's instead of ','s (at least when they're written)
var giant_cpu_string = ""
var giant_mem_string = ""
debug(my_name_data.length + '\n', my_proc_cpu_array, my_proc_mem_array)

for (var i = 0; i < my_name_data.length; i++) {
        giant_cpu_string += my_proc_cpu_array[i][0] + ' ' + my_proc_cpu_array[i][1] + '\n'
        giant_mem_string += my_proc_mem_array[i][0] + ' ' + my_proc_mem_array[i][1] + '\n'
}


//xdebug(giant_mem_string)

//Save file
if (mode != 0) {
    try {
        try {
            // myfile.writeFileSync(destdir + "topcpu", giant_cpu_string)
            my_write_file(destdir + "topcpu", giant_cpu_string, file_retries)

            // myfile.writeFileSync(destdir + "topmem", giant_mem_string)
            my_write_file(destdir + "topmem", giant_mem_string, file_retries)
        } catch {
            output_success = "(saved in home only)"
            console.log("Failed: Saving to", destdir + "\nTrying local directory and home.")
            // myfile.writeFileSync("~/topcpu", giant_cpu_string) //try to save in local dir
            // myfile.writeFileSync("~/topmem", giant_mem_string)
            // myfile.writeFileSync("topcpu", giant_cpu_string) //try to save in local dir
            // myfile.writeFileSync("topmem", giant_mem_string)

            my_write_file("~/topcpu", giant_cpu_string, file_retries)
            my_write_file("~/topmem", giant_mem_string, file_retries)
            my_write_file("topcpu", giant_cpu_string, file_retries)
            my_write_file("topmem", giant_mem_string, file_retries)

            destdir = "(Backup) ~/"
        }
    } catch (err) {
        output_success = false
        console.log("Could not output file(s) at all...") //x fill out later when I figure it out lol
        brisk_exit(err)
    }
        // myfile.writeFileSync(destdir + "topmem", my_proc_mem_array);
}

//Print output
if (mode != 1) {
    //debug(my_proc_mem_array, my_proc_cpu_array)
    inform(giant_mem_string)
    inform(giant_cpu_string)

}

// debug(my_name_data, my_cpu_data ,my_mem_data)




function verbose() {
    inform("\n")
    inform("mode: " + mode)
    inform("  0=Print\n -1=Both(output to /var/tmp)\n  2=User specified output\n  3=Zero and Two(Debug)")
    // inform("current setting:", mode,"\n")
    if (!output_success) inform("Destination Directory: " + destdir)
    if (mode != 0) {
        inform(destdir + "topmem & cpumem", "\n")
        inform("File output success? : ")
        inform("\x1b[32m" + output_success.toString()+"\x1b[0m ")
    }
    else inform ("\nPrint complete")
} verbose()


brisk_exit()



