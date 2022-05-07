#!/usr/bin/env node

/* LICENSE
    You put my github https://github.com/idealius somewhere in your docs or code then cool =)
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

var DEBUG_MODE = false //not your compiler's debug, this is not safe for running through conky
var MAX_LINES = 5
var FILE_SOURCE = "top" //default is set to top
var FILE_SRC_BOOL = true //true for one file source, false for multiple

var INFORM_VERBOSE = false //Really shouldn't change this. console logging enabled, then alias 'inform' below
var error_log = ""
var inform_log = ""
var debug_log = ""
var last_debug = ""
var debug_run = 0

var shell = require('child_process')
var myfile = require('fs')
var mode = 1
var destdir = ""
var red_data //this is the data read from ps/top output. it's called red because he's the man who can get you things...
var output_success = true

var FILE_RETRIES = 100

//Set these up early because error logging
var my_write_file = function(filename, str, retries) {
    for (var i = 0; i < retries; i++) {    
        myfile.writeFileSync(filename, str)
        //x console.log("path:", filename)
        //x console.log(data)
        return
        // if (!myfile.existsSync(filename)) i++ //x
        //  else return true*/
    }
}
//remoras is that symbiotic fish /w sharks. this 'eats' the useless chars at the EOF //x double check if need this
var my_remoras = function (data) {
    var row_index = data.length-1
    var row
    while (row_index >= 0) {
        row = data[row_index]
            for (var i = row.length-1; i >= 0; i--) {
                if (row[i] != ' ' || row[i] != '\n') {
                    if (i == row.length-1) return data
                    data[row_index] = row.slice(0, i+1)
                    return data
                } 
            }
            data.pop() //removes last row of array
            row_index--
        }
        return data   
}

var my_read_file = function(filename, retries) {
    var err_track = "" //I'm not sure (err) below is accessible at this level of scope hence this var
    var i = 0
    while (i < retries) {
        try {
            var data = myfile.readFileSync(filename, {encoding:'utf8'})
            if (data == "" || data == null || data === undefined) {
                add_error("Error accessing \'" + filename + "\', file exists, but is empty")
                continue 
            }
            break
        }
        catch(err) {
            err_track = err
            add_error("Error accessing \'" + filename + "\', error code:" + err)
            i++
            continue
        }
    }
    if (i == retries) {
        console.log("Error reading \'" + filename + "\', retries:" + retries)
        process.exit(-1)
    }
    // return my_remoras(data)
    return data
}

var copy_file = function(src, dest, retries) { //x deprecated
    //yes, I know about fs.copyFile(src, dest[, mode], callback), but this already has retries ready to go
    var data = my_read_file(src, retries)
    my_write_file(dest, data, retries)
}

var brisk_exit = function(err) {
    // myfile.writeFileSync("gmd_err.log", error_log)
    if (DEBUG_MODE) {
        if (error_log != null) my_write_file("gmd_err.log", error_log, FILE_RETRIES)
        if (inform_log != null) my_write_file("gmd.log", inform_log, FILE_RETRIES)
        if (debug_log != null) my_write_file("gmd_debug.log", debug_log, FILE_RETRIES) //x might want to make a DEBUG_OVERRIDE
    }
    process.exit(err)
}
var myargs = process.argv //remove file location columns 'node', './'
// console.log (myargs)
myargs = myargs.slice(2)

//Process cmd line arguments
var i = 0
while (myargs[i] != undefined) {// && myargs[i] !== null) {
    var my_arg = myargs[i]
    var eq = my_arg.indexOf("=")
    my_arg = (eq > 0) ? my_arg.slice(0,eq) : my_arg
    // console.log(my_arg)
    switch (my_arg) {
        case "-t":
        case "-top": //actually unneeded as long as earlier declaration of FS stays as top
            FILE_SOURCE = "top" //read proc/cpu/mem info from
            break
        case "-p":
        case "-ps":
            FILE_SOURCE = "ps" //read proc/cpu/mem info from
            break
        case "-o":
        case "-onefilesrc":
            FILE_SRC_BOOL = !FILE_SRC_BOOL
            break
        case "-m":
        case "-maxlines":
            var num = myargs[i].slice(eq+1)
            MAX_LINES = parseInt(num)
            // console.log(num)
            break
        case "-g":
        case "-gab": //debug
            mode = 3
            DEBUG_MODE = true
            INFORM_VERBOSE = true
            if (destdir == "") destdir = "./"
            if (destdir[destdir.length-1] != '/') destdir += '/'
            console.log("User supplied file output mode")
            break
        case " ": //small catch for user error
            break;
        default: //intended usage, and silent
            // mode = 1
            destdir = myargs[i]
            if (destdir[destdir.length-1] != '/') destdir += '/'
            //console.log("User supplied file output mode")
            break
        }    
        i++
}
var gmd_cache_name = destdir + ".gmdcache"

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
    return
}
// INFORM
var inform = function(str){
    if (INFORM_VERBOSE) console.log(str)

    if (str[str.length-1] != "\n") str += "\n"
    inform_log += str
}
// DEBUG
// check if object is a string, Orwellophile (stackoverflow) 
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

var debug = function(str, unlimited){
    if (!DEBUG_MODE) return //this prevents logging in 'production' mode
    try {
        var my_str = JSON.stringify(str) + ""
        var str = my_str
    }
    catch {
        return
    }
    if (my_str == last_debug && last_debug != "") {
        debug_run++
        return
    }
    else {
        if (debug_run != 0) {
            my_str = "Last debug message duplicated [" + debug_run + "] times.\n" + str 
            debug_run = 0
        }
        
    }
    last_debug = my_str
    if (my_str[my_str.length-1] !="\n") my_str += "\n"
    debug_log += my_str
    if (DEBUG_MODE) {
        if(unlimited) console.dir(my_str, { depth: null }); 
        else console.log(my_str)
    }
}


debug(1)

var file_collection = []
if (FILE_SOURCE == "top") {
    var shell_cmd = "top -b -n 1 > " + gmd_cache_name
    shell.execSync(shell_cmd)
    var header = 7
    file_collection.push(gmd_cache_name)
}
else {
    var header = 1
    if (FILE_SRC_BOOL) { //one file source, multiple columns
        var destcomp = destdir + ".gmdcache"
        var shell_cmd = "sh -c \'ps axo rss,pcpu,comm > " + destcomp + "\'" 
        shell.execSync(shell_cmd)
        file_collection.push(destcomp)
    }
    else { //multiple files, one numeric column per
        var destmem = destdir + ".gmdmemcache"
        var destcpu = destdir + ".gmdcpucache"
        //x Need to check if we don't run the ps command twice we will miss truncated process cpu / mem data (caused by ps behavior)
        // In typical Linux fashion, for some arcane shell reason this doesn't work (and neither does doing two
        // separate shell.execSyncs):
        // var shell_cmd = "ps axo rss,comm > " + destmem + " && " + "ps axo pcpu,comm > " + destcpu
        // Luckily, this works:
        var shell_cmd = "sh -c \'ps axo rss,comm > " + destmem + " && " + "ps axo pcpu,comm > " + destcpu + "\'"
        // var shell_cmd = "ps axo pcpu,comm > " + destcpu
        shell.execSync(shell_cmd)
        file_collection.push(destmem)
        file_collection.push(destcpu)
    }
}
debug(2)

//Schema level functions
String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

//For deep copying arrays
function deepCopy(array) {
    return JSON.parse(JSON.stringify(array));
}

//Sanitize numbers
function sanitize(myvar) {
    // return (myvar === null || myvar === undefined || isNaN(myvar)) ? 0 : parseFloat(myvar)
    return isNaN(myvar) ? 0 : parseFloat(myvar)
}


    //round float to precision
var decimal_round = function(num, prec) {
    //debug(num)
    //if (num == parseInt(num)) return num //not even a decimal //spd
    var num_str = num.toString()
    var dec = 0
    prec++
    
    while (num_str[dec] != '.' && dec < num_str.length) dec++ //find decimal point position


    if (dec + prec >= num_str.length) return num //decimal not long enough anyway / no trailing digit

    var wedge = parseInt(num_str[dec + prec - 1]) //just some string interators with interesting names...
    var biggs = parseInt(num_str[dec + prec])

    if (biggs > 4) { // >4 we round up
        wedge = (wedge < 9) ? wedge++ : 0
        
        var digit = dec + prec - 2
        while (digit >= 0) {
            if (parseInt(num_str[digit]) == 9) {
                num_str.replaceAt(digit, 0)
                digit--
            }
            else break
        }
        // num_str[dec + prec] = last_digit // doesn't work    
        num_str.replaceAt(dec + prec, wedge)
    }

    num_str = num_str.slice(0, dec + prec)
    return parseFloat(num_str)
}


/******************Data::Filtering**Adding**Ordering*************************************/
class data_fao {
    
    cache_data = "" //initial cache file //x these two rows are deprecated, no?
    my_name_data = [] //holds label names from row data

    //Functions:
    
    // Extract column from row with space delimter
    // 6561 ilius  20   0 1108.7g 369140 259080 S   0.0   9.2   0:13.05 chrome
    // Memory is column 10 from top
    extract_column(col, source_row) {
        "use strict"; //x need to normalize
        var col_repeat = -1 //column
        //v edge case
        if (source_row[0] != ' ') {
            if (col == 0 ) return source_row.slice(0, source_row.indexOf(' ')) // doesn't handle single column case
            col_repeat++
        }

        var a = 0 //index of 'cursor' on begin mem string
        var b = 0 //index of 'cursor' on end mem string
        
        while (col_repeat < col && a < source_row.length) {
            
            //If space here,              and non-space next...
            if (source_row[a] == ' ' && source_row[a+1] != ' ') {
                col_repeat++
                if (col_repeat >= col) {
                    b = source_row.indexOf(' ', a+2)
                    if (b == -1) {
                        b = source_row.indexOf('\n', a+2)
                        if (b == -1) b = source_row.length
                    }
                    
                }
                //Cap it at the end of the loop...
            }
            //x debug(a, b)
            a++
        }
        // ret = sanitize(ret) // (ret === null || ret === undefined || isNaN(ret)) ? 0 : ret //x debug
        return source_row.slice(a, b)
    }


    //checks array rows for duplicate element, returns two vars: .result and .value
    contains = function(search_str, array_str) {
        var a = {
            result: false,
            index: 0
        }
        if (!isString(search_str)) return a    
        
        //x debug(search_str + " SEARCH STR")
        for (var i = 0; i < array_str.length; i++) { //array level...
            if (search_str == array_str[i]) { //x
                a.result = true
                a.index = i
                break
            }
        }
        return a
    }

    //Main data consolidation loop with details inline:
    collapse_data() { 
        debug(5)

        var marked_for_del = [] //hash for all the rows of duplicate name columns        
        var marked_for_label = [] //hash for all the rows of duplicate name columns        

        // The following is a 
        // refactoring of the loop to accomodate either one data source, or
        // multiple data source "modes"
        if (this.lonesrc) {
            var cache_data = this.fc.columns[0].cache
            for (var i = 0; i < cache_data.length; i++) {
                if (cache_data.length - i < 2) { // only check last couple lines
                    if (this.fc.columns[0].my_name_data[i] == "" || !isString(this.fc.columns[0].my_name_data[i])) { //x this.fc.columns[c].my_name_data[i] == " " ||
                        marked_for_del.push(true)
                        continue
                    }
                }
                var raw = []
                for (var c = 0; c < this.fc.columns.length; c++) {
                    //May as well clean up the bottom of the name list... //x Should refactor this to the readfile stage...       

                    raw.push(this.extract_column(this.fc.columns[c].col_num, cache_data[i])) //Memory, cpu data
                    
                    if (this.fc.columns[c].conversion != null) { //conversion function check
                        //x console.log("CONVERSION != null")
                        raw[c] = parseFloat(this.fc.columns[c].conversion(raw[c]))
                    }
                    else raw[c] = parseFloat(raw[c])
                    this.fc.columns[c].numeric.push(raw[c]) // we dont know if its a dupe yet so we round again probably can refactor
                }

                //check for dupe
                var dupe = []
                dupe.push({result:false})
                // console.log("HI eye:", i)
                var tmp_str_array = this.fc.columns[0].my_name_data.slice(0, i) // clip name row array to only search up to our current index. this ensures it's always the first name in the list which is labeled and kept
                if (i != 0) { // v Start checking for duplicate
                    var dupe = this.contains(this.fc.columns[0].my_name_data[i], tmp_str_array)
                }

                marked_for_label.push(0)
                if (!dupe.result) {
                    //No dupe, new name, add new rows to our cpu/mem arrays
                    marked_for_del.push(false)
                    raw.forEach(el => raw[c] = decimal_round(sanitize(raw[c]), 2)) // rounding sparingly in the right spots avoids 'rounding creep' for summing duplicates
                }
                else { //"Duplicate" so add up totals...
                    marked_for_del.push(true)
                    marked_for_label[dupe.index] ++
                    // console.log('Original index:' + dupe.index, 'I:' +i) //good for seeing if dupe.index is too high (higher than i)
                    // console.log("LENGTH VS:",this.fc.columns[c].numeric.length, dupe.index, i) //x dupe.index is problem
                    for (var c = 0; c < this.fc.columns.length; c++) {
                        var article = [this.fc.columns[c].numeric[dupe.index], raw[c]] 
                        article.forEach( (el, indy) => article[indy] = sanitize(el) )
                        var my_float = article.reduce((a, b) => a + b, 0) //sum single column array
                        // debug(my_float + ' ' + raw[c])
                        // debug("SUM:" + my_float + " DUPE:" + this.fc.columns[c].numeric[dupe.index] + " RAW:" + raw)
                        this.fc.columns[c].numeric[dupe.index] = decimal_round(my_float, 2)
                    }                   
                }
            }
        }
        else {
            this.fc.columns.forEach(function() { marked_for_del.push([]) 
                                                 marked_for_label.push([]) })
            for (var c = 0; c < this.fc.columns.length; c++) {
                var cache_data = this.fc.columns[c].cache
                for (var i = 0; i < cache_data.length; i++) {
                    var raw = this.extract_column(this.fc.columns[c].col_num, cache_data[i])
                    //May as well clean up the bottom of the name list... //x Should refactor this to the readfile stage...       
                    if (cache_data.length - i < 2) { // only check last couple lines
                        if (this.fc.columns[c].my_name_data[i] == "" || !isString(this.fc.columns[c].my_name_data[i])) { //x cut this out: this.fc.columns[c].my_name_data[i] == " " || 
                            marked_for_del[c].push(true)
                            continue
                        }
                    }

                    if (this.fc.columns[c].conversion != null) { //conversion function check
                        //x console.log("CONVERSION != null")
                        raw = parseFloat(this.fc.columns[c].conversion(raw))
                    }
                    else raw = parseFloat(raw)
                    //check for dupe
                    var dupe = []
                    dupe.push({result:false})
                    // console.log("HI eye:", i)
                    var tmp_str_array = this.fc.columns[c].my_name_data.slice(0, i) // clip name row array to only search up to our current index
                    if (i != 0) { // v Start checking for duplicate
                        var dupe = this.contains(this.fc.columns[c].my_name_data[i], tmp_str_array)
                    }

                    this.fc.columns[c].numeric.push(decimal_round(raw, 2)) //x trying without parseFloat()

                    marked_for_label[c].push(0)
                    if (!dupe.result) {
                        //No dupe, new name, add new rows to our cpu/mem arrays
                        marked_for_del[c].push(false)
                    }
                    else { //"Duplicate" so add up totals...
                        marked_for_del[c].push(true)
                        marked_for_label[c][dupe.index] ++
                        // console.log("LENGTH VS:",this.fc.columns[c].numeric.length, dupe.index, i) //x dupe.index is problem

                        var article = [this.fc.columns[c].numeric[dupe.index], raw] 
                        article.forEach( (el, indy) => article[indy] = sanitize(el) )
                        var my_float = article.reduce((a, b) => a + b, 0) //sum single column array
                        // debug(my_float + ' ' + raw)
                        // debug("SUM:" + my_float + " DUPE:" + this.fc.columns[c].numeric[dupe.index] + " RAW:" + raw)
                        this.fc.columns[c].numeric[dupe.index] = decimal_round(my_float, 2)
                    }
                }
            }
        }
        debug(6)    
        // debug(this)
        // this.fc.columns.forEach(el => console.log(el.numeric))
        //'Delete' marked_for_del in the name arrays and build our lists
        if (this.lonesrc) {
            var cache_my_name_data = []
            var cache_marked_label = []
            var cache_numeric_data = []
            this.fc.columns.forEach(function() { cache_numeric_data.push([]) } )
            // debug(cache_numeric_data.length + ' ' + cache_numeric_data + '..<-')
            for (var i = 0; i < this.fc.columns[0].my_name_data.length; i ++) {
                if (!marked_for_del[i]) {
                    cache_my_name_data.push(this.fc.columns[0].my_name_data[i])
                    cache_marked_label.push(marked_for_label[i])
                    for (var c = 0; c < this.fc.columns.length; c++) {        
                        cache_numeric_data[c].push(this.fc.columns[c].numeric[i])
                    }
                }
            }
            for (var c = 1; c < this.fc.columns.length; c++) {
                for (var i = 0; i < this.fc.columns[0].my_name_data.length; i ++) {
                    if (!marked_for_del[i]) {
                        cache_numeric_data[c].push(this.fc.columns[c].numeric[i])
                    }
                }
            }
            for (var c = 0; c < this.fc.columns.length; c++) {
                this.fc.columns[c].numeric = cache_numeric_data[c]
                // debug(cache_numeric_data[c])
            }
            this.fc.columns[0].my_name_data = cache_my_name_data
            marked_for_label = cache_marked_label
        }
        else {
            for (var c = 0; c < this.fc.columns.length; c++) {
                var cache_my_name_data = []
                var cache_numeric_data = []
                var cache_marked_label = []
                // console.log (this.fc.columns[c].numeric.length, 'vs', this.fc.columns[c].my_name_data.length)
                for (var i = 0; i < this.fc.columns[c].my_name_data.length; i++) {
                    if (!marked_for_del[c][i]) {
                        // if (marked_for_label)
                        cache_numeric_data.push(this.fc.columns[c].numeric[i])
                        cache_my_name_data.push(this.fc.columns[c].my_name_data[i])
                        cache_marked_label.push(marked_for_label[c][i])
                    }
                }
                this.fc.columns[c].my_name_data = cache_my_name_data
                this.fc.columns[c].numeric = cache_numeric_data
                marked_for_label[c] = cache_marked_label
            }
        }

        if (this.lonesrc) {
            //Build Composite 1 list ready for sorting
            var row_count = this.fc.columns[0].my_name_data.length
            for (var i = 0; i < row_count; i++) {
                //xNOTE we didnt slice numeric to name this time could cause issue later
                var my_name = this.fc.columns[0].my_name_data[i]
                var my_label = marked_for_label[i]
                var new_name = (my_label == 0) ? my_name : my_name + ':(' + (my_label + 1) + ')'
                this.fc.columns[0].composite1.push(Array(this.fc.columns.length + 1))
                this.fc.columns[0].composite1[i][0] = new_name
                for (var c = 0; c < this.fc.columns.length; c++) {
                    this.fc.columns[0].composite1[i][c+1] = this.fc.columns[c].numeric[i]
                    //slice off the ends of our mem and cpu lists to match the name list
                }
            }
            // debug (this.fc.columns[0].composite1 + '<-2')
        }
        else {
            //Build 2+ Composite 1 lists ready for sorting
            for (var c = 0; c < this.fc.columns.length; c++) {
                //slice off the ends of our mem and cpu lists to match the name list
                var row_count = this.fc.columns[c].my_name_data.length
                var my_numeric = this.fc.columns[c].numeric.slice(0,row_count) //this.fc.columns[c].numeric // variable names getting a little long..//x possibly optional
                for (var i = 0; i < this.fc.columns[c].my_name_data.length; i++) {
                    // my_numeric[i] = (my_numeric[i] === null || my_numeric[i] === undefined || isNaN(my_numeric[i])) ? 0 : my_numeric[i]
                    var my_label = marked_for_label[c][i]
                    var my_name = this.fc.columns[c].my_name_data[i]
                    var new_name = (my_label == 0) ? my_name : my_name + ':(' + (my_label + 1) + ')'
                    this.fc.columns[c].composite1.push([new_name, my_numeric[i]])
                }
            }
        }
    }

    
   
    // array_swap_element = function(arr, fromIndex, toIndex) { //deprecated
    //     var toIndex_cache = arr[toIndex]
    //     var fromIndex_cache = arr[fromIndex]
    //     arr[fromIndex] = toIndex_cache
    //     arr[toIndex] = fromIndex_cache //x I need to look at this algo all over again because my_arr = modify_arr_func(my_arr) appears to work when I use node shell
    //     return arr
    // }

    // Sort lists descending from the top-to-bottom by second column
    // Basically, we're looking for the biggest number larger than us to swap as we
    // descend the array w/o restarting the loop
    my_sort = function () {
        //x debug(data_array.length)
        if (this.lonesrc) {
            var og_data = this.fc.columns[0].composite1 // this is merely for abbreviation purposes
            var done = false
            for (var c = 0; c < this.fc.columns.length; c++) {
                var shifts = 0
                var comp_cache = og_data
                this.fc.columns[c].composite1 = og_data
                for (var i=0;i<comp_cache.length;i++) {
                    var mem_cont = comp_cache[i][c+1]
                    var mem_pos = i
                        
                    for (var k=i+1;k<comp_cache.length;k++) {
                        var next_seed = comp_cache[k][c+1]
                        if (next_seed > mem_cont) {
                            mem_cont = next_seed
                            mem_pos = k
                        }                           
                    }
                    if (mem_pos != i) {   //swap two values:      
                        var swapper = comp_cache[mem_pos]
                        comp_cache[mem_pos] = comp_cache[i]
                        comp_cache[i] = swapper
                        shifts++
                        if (i >= this.col_len()) { done = true; break }
                    }
                    if (done) break
                }
                
                debug("Shifts: " + shifts)
                this.fc.columns[c].composite1 = deepCopy(comp_cache) // deepCopy is necessary here because if not col 1+ 
                                                                     // has no populated composite2's, yet are based 
                                                                     // on col 0's composite1 so refs get duped
            }
        }
        else {
            for (var c = 0; c < this.fc.columns.length; c++) {
    
                var shifts = 0
                var comp_cache = this.fc.columns[c].composite1
                for (var i=0;i<comp_cache.length;i++) {
                    var mem_cont = comp_cache[i][1]
                    var mem_pos = i
                        
                    for (var k=i+1;k<comp_cache.length;k++) {
                        var next_seed = comp_cache[k][1]
                        if (next_seed > mem_cont) {
                            mem_cont = next_seed
                            mem_pos = k
                        }                           
                    }
                    if (mem_pos != i) {   //swap two values:      
                        var swapper = comp_cache[mem_pos]
                        comp_cache[mem_pos] = comp_cache[i]
                        comp_cache[i] = swapper
                        shifts++
                    }
                }
                
                debug("Shifts: " + shifts)
                this.fc.columns[c].composite1 = comp_cache
            }
        }
    }

    col_len() {
        return (MAX_LINES > this.fc.columns[0].my_name_data.length) ? this.fc.columns[0].my_name_data.length : MAX_LINES
    }

    giant_strings() {
        //Convert to one big string with '\n's instead of ','s (at least when they're written)
        
        if (this.lonesrc) {
            for (var c = 0; c < this.fc.columns.length; c++) {
                var giant_string = ""
                // this.fc.columns[c].composite2 = []
                // debug(my_name_data.length + '\n' + my_proc_cpu_array + '\n' + my_proc_mem_array)
                for (var i = 0; i < this.col_len(); i++) {
                        //              name  v                     +    column data v
                        for (var k = 0; k < this.fc.columns.length+1; k++ ) {
                            // more columns
                            giant_string += this.fc.columns[c].composite1[i][k] + ' '
                        }
                        giant_string = giant_string.slice(0,giant_string.length-1)
                        giant_string += '\n'
                }
                this.fc.columns[c].composite2 = giant_string
            }
        }
        else {

            for (var c = 0; c < this.fc.columns.length; c++) {
                var giant_string = ""
                // this.fc.columns[c].composite2 = []
                // debug(my_name_data.length + '\n' + my_proc_cpu_array + '\n' + my_proc_mem_array)
                var row_total = (MAX_LINES > this.fc.columns[c].my_name_data.length) ? this.fc.columns[c].my_name_data.length : MAX_LINES
                //MAX_LINES
                for (var i = 0; i < row_total; i++) {
                        //              name  v                     +    column data v
                        giant_string += this.fc.columns[c].composite1[i][0] + ' ' + this.fc.columns[c].composite1[i][1] + '\n'
                }
                this.fc.columns[c].composite2 = giant_string
            }
        }
    }

    save_all() {
        //Save file
        if (mode == 0) return

        for (var c = 0; c < this.fc.columns.length; c++) {
            var path = this.fc.columns[c].dest
            debug('saving...')
            debug("PATH:" + path, this.fc.columns[c].composite2)
            my_write_file(path, this.fc.columns[c].composite2, FILE_RETRIES)
        }
    }

    save_one(col) {
        if (mode != 0) {
            var path = this.fc.columns[col].dest
            debug('saving...')
            debug("PATH:" + path, this.fc.columns[col].composite2)
            my_write_file(path, this.fc.columns[col].composite2, FILE_RETRIES)
        }
    }

    print_all() {
        debug('data:')
        for (var c = 0; c < this.fc.columns.length; c++) {
            console.dir(this.fc.columns[c].composite1)
        }
    }

    print_one(col) {
        debug('data:')
        console.dir(this.fc.columns[col].composite1)
    }

    save_conky(path) {
        //<- some more formatting for fieldname <-> column transitions
        var my_str = ""
        for (var c = 0; c < this.fc.columns.length; c++) {
            // ${color2}CPU Average${color0}${alignr}${cpu cpu0}%
            // ${cpubar cpu0 10,}
            if (this.fc.columns[c].bar) {
                my_str += this.fc.columns[c].bar_lua_func(this.fc.columns[c].fieldname)
            }
            // my_str += this.fc.columns[c].fieldname 
            for (var i = 0; i < this.col_len(); i++) {
                my_str += this.fc.columns[c].composite1[i][0] +" $alignr " +  this.fc.columns[c].composite1[i][c+1] + this.fc.columns[c].label
                my_str += '\n'
            }
            my_str += '\n'
        }
        // console.log(my_str)
        my_write_file(path, my_str, FILE_RETRIES)
    }

    //UTILITARY FUNCTION END
    
    //This is what our data structure looks like inside our class:
    //Not 100% required, but it's useful to look at and use in the constructor as a target location
    fc = { // fc = file collection
        srcfiles:[""],
        lonesrce:false, //file src
        columns:[ { cache:null, //our og file read //x used?
                    my_name_data:[],
                    col_num:0,   //column number, should be 1 to 1 with destfiles & data //or just do this object style
                    conversion:null,  //conversion function (if applicable)
                    dest:"",
                    numeric:[],  //1 column numeric data from file
                    composite1:[],  //name + numeric ready for manip
                    composite2:[],  //giant str made up of str lines of name + numeric ready for file output
    
        } ]
    }

    // src_len(){
    //     if (this.lonesrc) return 1
    //     else return this.fc.srcfiles.length
    // }

    constructor(lonesrc, fc) {
        this.fc = fc //? needed?
        this.lonesrc = lonesrc
        // this.fc = deepCopy(fc) //? needed?
        debug(4)
        var f = 0
        // debug(this.fc.srcfiles.length)

        if (this.lonesrc) {
            this.fc.columns[0].my_name_data = []
            // debug(this.fc.srcfiles + ' <-')
            var cache_data = my_read_file(this.fc.srcfiles[0], FILE_RETRIES)
            cache_data = cache_data.split("\n")
            cache_data = cache_data.splice(header)
            //Get names really quick
            this.fc.columns[0].cache = cache_data
            for (var c = 0; c < this.fc.columns.length; c++) { //get names really quick
                this.fc.columns[c].composite1 = [] 
                this.fc.columns[c].composite2 = []
                this.fc.columns[c].numeric = [] //just some initialization of arrays for push
            }
            for (var i = 0; i < cache_data.length; i++) { 
                var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)
                this.fc.columns[0].my_name_data.push(cache_string)
            }
        }
        else {
            for (var c = 0; c < this.fc.columns.length; c++) {
                if (this.lonesrc && c > 0) break
                this.fc.columns[c].numeric = [] //just some initialization of arrays for push
                this.fc.columns[c].composite1 = [] 
                this.fc.columns[c].composite2 = []
                this.fc.columns[c].my_name_data = []
                var cache_data = my_read_file(this.fc.srcfiles[c], FILE_RETRIES)
                cache_data = cache_data.split("\n")
                cache_data = cache_data.splice(header)

                //Get names really quick
                for (var i = 0; i < cache_data.length; i++) {
                    var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)
                    // if (cache_string[cache_string.length-1] == '\n') {
                    //     cache_string = cache_string.pop() 
                    // }
                    // debug(cache_string)
                    this.fc.columns[c].my_name_data.push(cache_string) //dont need second arg for slice  
                }
                this.fc.columns[c].cache = cache_data
            }
        }
    }
}
/****************************************************************************************/

debug(3)

debug(file_collection)

if (FILE_SOURCE == "top") {
    var my_job = new data_fao(FILE_SRC_BOOL, {
        srcfiles: file_collection,
        columns: [ {col_num:6, conversion:function(el) {return decimal_round(el / 1000, 2)}, dest: destdir + ".redmem"},
                   {col_num:9, conversion:null,                                              dest: destdir + ".redcpu"},
        ] 
    })
}
else { //or ps

    if (FILE_SRC_BOOL) {
        var my_job = new data_fao(FILE_SRC_BOOL, {
            srcfiles: file_collection,
            columns: [ {col_num:1, conversion:null,
                        dest: destdir + ".redcpu" ,
                        fieldname: "Average CPU",
                        label: "%",
                        bar: true,
                        bar_lua_func: function(str) {return "${color white}" + str + "${color EAEAEA}${alignr}${cpu cpu0}%\n${cpubar cpu0 10,}\n"} },
                        
                        {col_num:0, conversion:function(num) {return decimal_round(num / 1000, 2)},
                        dest: destdir + ".redmem" ,
                        fieldname: "RAM",
                        label: " MB",
                        bar: true,
                        bar_lua_func: function(str) {return "${color white}" + str + "${color EAEAEA}${alignr}${mem}\n${membar 10,}\n"} },
                       
                ] 
        })
    }
    else {
        var my_job = new data_fao(FILE_SRC_BOOL, {
            srcfiles: file_collection,
            columns: [ {col_num:1, conversion:function(el) {return decimal_round(el / 1000, 2)}, dest: destdir + ".redmem"},
                       {col_num:1, conversion:null,                                              dest: destdir + ".redcpu"},
                ] 
        })
    }
}

// debug(my_job.fc.columns[0].my_name_data)
// console.log(my_job.fc.columns)

debug(4.5)
my_job.collapse_data()
debug(8)
my_job.my_sort()
// console.log(my_job.fc.columns, '<-')
debug(8.5)
my_job.giant_strings()
debug(9)
// console.dir(my_job.fc.columns[0])
// console.dir(my_job.fc.columns[1])
my_job.save_conky(destdir + ".redeval")
// my_job.save_all()






//Print output
if (mode != 1) {
    my_job.print_all()
}

var verbose = function(){
    inform("\n")
    inform("mode: " + mode)
    inform("  0=Print\n -1=Both(output to /var/tmp)\n  2=User specified output\n  3=Zero and Two(Debug)")
    // inform("current setting:", mode,"\n")
    if (!output_success) inform("Destination Directory: " + destdir)
    if (mode != 0) {
        if (my_job.fc.lonesrc) my_job.fc.columns[0].dest
        else my_job.fc.columns.forEach(el => inform(el.dest))
        inform("File output success? : ")
        inform("\x1b[32m" + output_success.toString()+"\x1b[0m ")
    }
    else inform ("\nPrint complete")
} 

if (INFORM_VERBOSE) verbose()

debug("exiting...")
brisk_exit()



