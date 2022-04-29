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

var DEBUG_MODE = false //not your compiler's debug
var FILE_SOURCE = "top"

var INFORM_VERBOSE = true //Really shouldn't change this. console logging enabled, then alias 'inform' below
var error_log = ""
var inform_log = ""
var debug_log = ""

var shell = require('child_process')
var myfile = require('fs')
var mode = 1
var destdir = "File unsaved for: "
var red_data //this is the data read from ps/top output. it's called red because he's the man who can get you things...
var my_name_data = []
var my_cpu_data = []
var my_numeric = []
var output_success = true

var cache_my_name_data = []
var my_proc_mem_array = []
var my_proc_cpu_array = []

//This a file piped from top/ps we parse as our only initial data set
var gmd_cache_name = ".gmdcache"
var file_retries = 100

//Set these up early because error logging
var my_write_file = function(filename, data, retries) {
    var i = 0
    while (i < retries) {
        myfile.writeFileSync(filename, data)
        console.log("path:", filename)
        console.log(data)
        if (!myfile.existsSync(filename)) i++
        else return true
    }
}

var my_read_file = function(filename, retries) {
    var err_track = "" //I'm not sure (err) below is accessible at this level of scope hence this var
    var i = 0
    while (i < retries) {
        try {
            var data = myfile.readFileSync(filename, {encoding:'utf8'})
            return data
        } catch(err) {
            err_track = err
            add_error("Error accessing \'" + filename + "\', error code:" + err)
            i++
            continue
        }
        if (data == "" || data == null || data === undefined) {
            add_error("Error accessing \'" + filename + "\', file exists, but is empty")
            i++
            continue    
        }
    }
    if (i == retries) {
        console.log("Error reading \'" + filename + "\', retries:" + retries)
        process.exit(-1)
    }
}

var copy_file = function(src, dest, retries) { //x deprecated
    //yes, I know about fs.copyFile(src, dest[, mode], callback), but this already has retries ready to go
    var data = my_read_file(src, retries)
    my_write_file(dest, data, retries)
}

var brisk_exit = function(err) {
    // myfile.writeFileSync("gmd_err.log", error_log)
    my_write_file("gmd_err.log", error_log, file_retries)
    if (!INFORM_VERBOSE || DEBUG_MODE) my_write_file("gmd.log", inform_log, file_retries)
    if (DEBUG_MODE) my_write_file("gmd_debug.log", debug_log, file_retries) //x might want to make a DEBUG_OVERRIDE
    process.exit(err)
}

const myargs = process.argv.slice(2) //remove file location columns 'node', './'

//Process cmd line arguments
var i = 0
while (myargs[i] != undefined) {// && myargs[i] !== null) {
    switch (myargs[i]) {
        case "-top":
            FILE_SOURCE = "top" //read proc/cpu/mem info from
            break
        case "-fork":
            mode = -1 //both print and save, but tied down to ./gmdcache for output
            destdir = "./"
            console.log("Print and Save mode")
            break
        case "-gab": //debug
            mode = 3
            DEBUG_MODE = true
            destdir = "./"
            if (destdir[destdir.length-1] != '/') destdir += '/'
            console.log("User supplied file output mode")
            break
        case " ": //small catch for user error
            break;
        default: //intended usage, and silent
            INFORM_VERBOSE = false
            mode = 1
            destdir = myargs[i]
            if (destdir[destdir.length-1] != '/') destdir += '/'
            //console.log("User supplied file output mode")
            break
        }    
        i++
}

if (i == 0) { //Finish things off by handling the 'no arguments case'
    mode = 0 //print
    console.log("Print mode")
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
// check if object is a string, Orwellophile (stackoverflow) 
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}
try {
    var debug = function(str){
        if (DEBUG_MODE) console.log(str)
        str += ""
        if (str[str.length-1] !="\n") str += "\n"
        debug_log += str
    }
}catch (err){
    console.log(add_error("\'Debugging mode\' unavailable, Error: " + err));
}


debug(1)
// var columns1 = "COLUMNS_CACHE=$COLUMNS & COLUMNS=100 &"
// var top_cmd = "top -b -n 1 > " + gmd_cache_path + 'tmp'
// var columns2 = " & COLUMNS=$COLUMNS_CACHE"
// shell.spawnSync('/bin/bash', ['-c \"top -b -n 1 > ' + gmd_cache_path +'\"']);
// shell.exec('cp ' + gmd_cache_path + 'tmp ' + gmd_cache_path)
var file_collection = []
if (FILE_SOURCE == "top") {
    var shell_cmd = "top -b -n 1 > " + gmd_cache_name
    shell.execSync(shell_cmd)
    var header = 7
    file_collection.push(gmd_cache_name)
}
else {
    var destmem = destdir + "redmem"
    var destcpu = destdir + "redcpu"

    var shell_cmd = "ps axo comm,rss > " + destmem
    shell.execSync(shell_cmd)
    file_collection.push(destmem)

    shell_cmd = "ps axo pcpu,rss > " + destcpu
    shell.execSync(shell_cmd)
    file_collection.push(destcpu)
    
    var header = 1
}
debug(2)

debug(red_data) //x

debug(3)

//Schema level functions
String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

//For deep copying arrays
function nestedCopy(array) {
    return JSON.parse(JSON.stringify(array));
}


/******************Data::Filtering**Adding**Ordering*************************************/
var data_fao = {
    
    cache_data: "",

    //Functions:
    
    // 6561 ilius  20   0 1108.7g 369140 259080 S   0.0   9.2   0:13.05 chrome
    // Memory is column 10 from top
    extract_column: function(col, source_array) {
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
    },


    //checks array for duplicate element, returns two vars: .result and .value
    contains: function(search_str, array_str) {
        var a = {
            result: false,
            index: 0
        }

        for (var i = 0; i < array_str.length; i++) { //array level...
            // v we're not interested in trailing chars past our search terms length, this is for proc grouping
            var cut_array = array_str[i].slice(0,search_str.length) //string level...
            if (search_str == cut_array) {
                a.result = true
                a.index = i
                break
            }
        }

        //This double checks there's no '+' before the '('. This doesn't help for processes that have a '+' right
        //there positionally alongside a duplicate process, but with a longer filename. However, it still
        //takes care of the other edge case which is much more common - where the + is for long process filenames)
        if (a.result) {
            var i = a.index 
            var start_pos = array_str[i].length //str level
            var parenth_pos = array_str[i].indexOf('(', i)
            start_pos = (parenth_pos > 0) ? parenth_pos : start_pos
            if (array_str[start_pos-1] == '+') a.result = false
        }

        return a
    },


    //round float to precision
    decimal_round: function(num, prec) {
        //debug(num)
        if (num == parseInt(num)) return num //not even a decimal
        var num_str = num.toString()
        var dec = 0
        prec++
        
        while (num_str[dec] != '.' && dec < num_str.length) dec++ //find decimal point position


        if (dec + prec >= num_str.length) return num //decimal not long enough anyway / no trailing digit

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
    },

    
    //Main data consolidation loop with details inline:
    collapse_data: function() { 
        debug(5)
        var cache_data = this.fc.cache

        for (var i = 0; i < cache_data.length; i++) {
            var marked_for_deletion = [] //hash for rows of duplicate name columns
            
            var values = []
            for (var c = 0; c < this.fc.columns.length; c++) {
                var ret = extract_column(columns[c], cache_data[i]) //Memory, cpu data
                // var extract_mem = decimal_round(parseFloat(ret) / 1000, 2) //Convert to MB ( / 1000) and adjust decimals
                if (this.fc.columns[c][1] != null) //conversion function check
                    ret = this.fc.conversion(ret)
                values.push(decimal_round(parseFloat(ret), 2)) //value extraction, order is important here
            }

            //May as well clean up the bottom of the name list... //x Should refactor this to the readfile stage...
            if (this.my_name_data[i] == " " || this.my_name_data[i] == "") {
                marked_for_deletion.push(true)
                continue
            }
            
            var tmp_str_array = this.my_name_data.slice(0, i) // clip array to only search up to our current index
            var dupe = []
            dupe.push({result:false})
            if (i != 0) { // v We got a duplicate here?
                var dupe = contains(this.my_name_data[i], tmp_str_array)
            }
            // else { //bail if it's the first index...
            //     dupe.result = false
            // }

            if (dupe.result) { //"Duplicate" so add up totals...
                
                //BUG Why is this data checking necessary? (starts, here actually we just do it later) v v v BUG
                // my_mem_data[value] = (my_mem_data[value] === null || my_mem_data[value] === undefined || isNaN(my_mem_data[value])) ? 0 : my_mem_data[value] 
                // my_cpu_data[value] = (my_cpu_data[value] === null || my_cpu_data[value] === undefined || isNaN(my_cpu_data[value])) ? 0 : my_cpu_data[value] 
                
                // debug(':' + value, my_name_data[value], my_mem_data[value], my_cpu_data[value]) //x debug
                //x if (value >= my_mem_data.length) debug("WTF?") //x debug lol
                for (var c = 0; c < this.fc.columns.length; c++) {
                    var my_float = this.fc.columns[c][2][dupe.index] + values[c]
                    this.fc.columns[c][2] = decimal_round(my_float)

                }
                // this.fc.columns[i].forEach( function(el) {return decimal_round(my_float + el)} )
                
                debug('{' + dupe.index, this.my_name_data[dupe.index], this.fc.columns[0][2][dupe.index]) //x debug
                marked_for_deletion.push(true)
                
                //update the process name in the form of a trailing '(x)' where x is the number of duplicate processes
                var length = this.my_name_data[value].length
                var c = length
                var name = this.my_name_data[dupe.index]
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
                    this.my_name_data[dupe.index] = name.slice(0, open_brk_pos+1) + my_int.toString() + name.slice(close_brk_pos)
                    //x debug(name) //x
                }
                else {
                    this.my_name_data[dupe.index] += ":(2)"
                }



            }
            else { //New name, add new rows to our cpu/mem arrays
                for (var c = 0; c < this.fc.columns.length; c++) {
                    this.fc.columns[c][2].push(extract_mem)
                    my_cpu_data.push(values[c])

                }
                marked_for_deletion.push(false)
            }
        }
   
        debug(this.my_name_data)
        debug(this.fc.columns[0][2])
        debug(6)    
   
        //Delete marked in the name array and build our 2 lists

        for (var i = 0; i < this.my_name_data.length; i++) {
            if (!marked_for_deletion[i]) cache_my_name_data.push(this.my_name_data[i])

        }

        this.my_name_data = cache_my_name_data
        //x debug("LENGTHS:", my_name_data.length, my_mem_data.length)
        //slice off the ends of our mem and cpu lists to match the name list
        var name_len = this.my_name_data.length
        
        for (var c = 0; c < this.fc.columns.length; c++) {
            this.fc.columns[c][2] = this.fc.columns[c][2].slice(0,name_len)
        }


        for (var i = 0; i < this.my_name_data.length; i++) {
            // debug(':' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
            //x Why is this necessary? v v v
            
            for (var c = 0; c < this.fc.columns.length; c++) {
                var my_numeric = this.fc.columns[c][2] // variable names getting a little long..
                my_numeric = (my_numeric[i] === null || my_numeric[i] === undefined || isNaN(my_numeric[i])) ? 0 : my_numeric[i]
                this.fc.columns[c][3].push([this.my_name_data[i], my_numeric[i]])
                this.fc.columns[c][2] = my_numeric
            }
            
            // debug('.' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
        }

    },
   
    //basically a brute force element swapping function that gets around modifying arrays out of scope by deep cloning it first
    array_swap_element: function(arr, fromIndex, toIndex) {
        var toIndex_cache = arr[toIndex]
        var fromIndex_cache = arr[fromIndex]
        var replacement = nestedCopy(arr)
        replacement[fromIndex] = toIndex_cache
        replacement[toIndex] = fromIndex_cache //x I need to look at this algo all over again because my_arr = modify_arr_func(my_arr) appears to work when I use node shell
        //x debug("Successfully moved row..")
        return replacement
    },

    //Sort lists descending from the top-to-bottom by second column
    //Over complicated because of my current ignorance on JS array scope management
    //Basically, we're looking for the biggest number larger than us
    // - /w restarting the loop, resuming an inner loop, and array cloning when swapping rows
    my_sort: function () {
        //x debug(data_array.length)
        for (var c = 0; c < this.fc.columns.length; c++) {
            var start_over
            var done = false
            var i_start_pos = 0
            var passes = 0
            var shifts = 0
            var data_array = this.fc.columns[c][3]
            var cache_array
            while(!done) {
                start_over = false
                passes++
                for (var i=i_start_pos;i<data_array.length;i++) {
                    for (var c=data_array.length-1;c>=0;c--) {
                        var next_seed = data_array[c][1]
                        if (c > i && next_seed > data_array[i][1]) {
                            // var gc_array = cache_array //x used ostensibly for gc
                            var mem_pos = c
                            var mem_cont = next_seed
                            //we found a suitable replacement, but let's just double check there isn't a bigger
                            //value further down the list because our swap operation is relatively mem expensive:
                            while (c > i) { 
                                c--
                                var contender = data_array[c][1]
                                if (contender > mem_cont) {
                                    mem_cont = contender
                                    mem_pos = c 
                                }
                            }
                            cache_array = this.array_swap_element(data_array, i, mem_pos)
                            // gc_array = null //Might help garbage collection (gc)
                            debug("Switched " + i + " with " + mem_pos)
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
                        i_start_pos = i+1
                        debug("Sorted index: " + i)
                    }
                }
                // debug(data_array)
            }
            debug("Passes: " + (passes - shifts) + " Shifts / Restarts: " + shifts)
            
            this.fc.columns[c][3] = cache_array
        }
    },

    giant_strings: function() {
        //Convert to one big string with '\n's instead of ','s (at least when they're written)
        
        for (var c = 0; c < this.fc.columns.length; c++) {
            var giant_string = ""
            // debug(my_name_data.length + '\n' + my_proc_cpu_array + '\n' + my_proc_mem_array)

            for (var i = 0; i < this.my_name_data.length; i++) {
                    //              name  v                     +    column data v
                    giant_string += this.fc.columns[c][3][0] + ' ' + this.fc.columns[c][3][1] + '\n'
            }
            this.fc.columns[c][4] = giant_string
        }
    },

    save_all: function() {
        //Save file
        for (var c = 0; c < this.fc.columns.length; c++) {
            var path = this.fc.destfiles[c]
            if (mode != 0) {
                my_write_file(path, this.fc.columns[c][4], file_retries)
            }
        }
    },


    //FUNCTION END
    my_name_data: [], //this is kept out of fc because it is considered constant per run

    fc: { // fc = file collection
        cache: [],
        srcfiles: [""],
        destfiles: [""],
        forked: false, //if forked use same srcfiles for moving data to destfiles
        columns: [ { col_num:0,   //column number, should be 1 to 1 with destfiles & data //or just do this object style
                     conversion:null,  //conversion function (if applicable)
                     numeric:[],  //actual numeric data from file
                     composite1:[],  //name + numeric ready for manip
                     composite2:[],  //giant str made up of str lines of name + numeric ready for file output

         } ]
    },

    run: function(fc) {
        this.fc = fc
        // if (!this.fc.forked) {
        // }

        var f = 0
        while (f < this.fc.srcfiles.length)
            for (var c = 0; c < this.fc.columns.length; c++)
            this.fc.cache = my_read_file(this.fc.srcfiles[f], file_retries)
            
            var cache_data = this.fc.cache
            cache_data = cache_data.split("\n")
            cache_data = cache_data.splice(header)

            //walk backwards for name
            for (var i = 0; i < cache_data.length; i++) {
                var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)
            
                this.my_name_data.push(cache_string) //dont need second arg for slice apparently 
                //x debug(my_data[i])
            }

        debug(4)
        this.collapse_data()
        debug(8)
        this.my_sort()
        debug(8.5)
        this.giant_strings()
        debug(9)
        this.save_all()
    },

    
    
}
/****************************************************************************************/

var x = {
    my_var: 0
}




var my_job = {}
my_job = data_fao
my_job.run({ srcfiles: file_collection,
            destfiles: [destdir + ".redmem", destdir + ".redcpu"],
            forked: true,
            columns: [ [6, function(el) {return decimal_round(el / 1000, 2)}, ".redmem"],
                       [9, null, ".redcpu"]
                     ] 
           })

//xdebug(giant_mem_string)


//Print output
if (mode != 1) {
    //debug(my_proc_mem_array, my_proc_cpu_array)
    for (var c = 0; c < my_job.fc.columns.length; c++) {
        inform(my_job.fc.columns[c][4])
    }
}

// debug(my_name_data, my_cpu_data ,my_mem_data)


function verbose() {
    inform("\n")
    inform("mode: " + mode)
    inform("  0=Print\n -1=Both(output to /var/tmp)\n  2=User specified output\n  3=Zero and Two(Debug)")
    // inform("current setting:", mode,"\n")
    if (!output_success) inform("Destination Directory: " + destdir)
    if (mode != 0) {
        inform(destdir + my_job.fc.destfiles[0], "\n")
        inform("File output success? : ")
        inform("\x1b[32m" + output_success.toString()+"\x1b[0m ")
    }
    else inform ("\nPrint complete")
} verbose()


brisk_exit()



