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
var MAX_LINES = 25
var FILE_SOURCE = "top" //default is set to top

var INFORM_VERBOSE = false //Really shouldn't change this. console logging enabled, then alias 'inform' below
var error_log = ""
var inform_log = ""
var debug_log = ""
var last_debug = ""
var debug_run = 0

var shell = require('child_process')
var myfile = require('fs')
var mode = 1
var destdir = "File unsaved for: "
var red_data //this is the data read from ps/top output. it's called red because he's the man who can get you things...
var output_success = true

//This a file piped from top/ps we parse as our only initial data set
var file_retries = 100

//Set these up early because error logging
var my_write_file = function(filename, str, retries) {
    var i = 0

    while (i < retries) {
        myfile.writeFileSync(filename, str)
        //x console.log("path:", filename)
        //x console.log(data)
        /* if (!myfile.existsSync(filename)) i++ //x
         else return true*/
        i++
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
                // process.exit()
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
        if (error_log != null) my_write_file("gmd_err.log", error_log, file_retries)
        if (inform_log != null) my_write_file("gmd.log", inform_log, file_retries)
        if (debug_log != null) my_write_file("gmd_debug.log", debug_log, file_retries) //x might want to make a DEBUG_OVERRIDE
    }
    process.exit(err)
}

const myargs = process.argv.slice(2) //remove file location columns 'node', './'

//Process cmd line arguments
var i = 0
while (myargs[i] != undefined) {// && myargs[i] !== null) {
    switch (myargs[i]) {
        case "-top": //actually unneeded as long as earlier declaration of FS stays as top
            FILE_SOURCE = "top" //read proc/cpu/mem info from
            break
        case "-ps":
            FILE_SOURCE = "ps" //read proc/cpu/mem info from
            break
        case "-fork":
            mode = -1 //both print and save, but tied down to ./ for output path
            destdir = "./"
            console.log("Print and Save mode")
            break
        case "-gab": //debug
            mode = 3
            DEBUG_MODE = true
            INFORM_VERBOSE = true
            destdir = "./"
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

    if (str[str.length-1] !="\n") str += "\n"
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
    }
    catch {
        return
    }
    if (my_str == last_debug && last_debug != "") {
        debug_run++
        last_debug = my_str
        return
    }
    else {
        if (debug_run != 0) {
            my_str = "Last debug message duplicated [" + debug_run + "] times."
            debug_run = 0
        }

    }
    if (my_str[my_str.length-1] !="\n") my_str += "\n"
    debug_log += my_str
    if (DEBUG_MODE) {
        if(unlimited) console.dir(my_str, { depth: null }); 
        else console.log(my_str)
    }
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
    
    var header = 1
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
        //v edge case
        if (col == 1 && source_row[0] != ' ') return source_row.slice(0, source_row.indexOf(' '))

        var a = 0 //index of 'cursor' on begin mem string
        var b = 0 //index of 'cursor' on end mem string
        var col_repeat = 0 //column
        
        while (col_repeat < col && a < source_row.length) {
            
            //If space here,              and non-space next...
            if (source_row[a] == ' ' && source_row[a+1] != ' ') {
                col_repeat++
                if (col_repeat >= col) {
                    b = source_row.indexOf(' ', a+2)
                    b = (b == -1) ? source_row.indexOf('\n', a+2) : b
                }
                //Cap it at the end of the loop...
            }
            //x debug(a, b)
            a++
        }
        var ret = source_row.slice(a, b)
        // ret = (ret === null || ret === undefined || isNaN(ret)) ? 0 : ret //x debug
        return ret
    }


    //checks array rows for duplicate element, returns two vars: .result and .value
    contains = function(search_str, array_str) {
        var a = {
            result: false,
            index: 0
        }
        // if (search_str == "chrome") console.log("CHROME") //notorious process hog if you use extensions
        if (!isString(search_str)) return a    
        
        // if (search_str == "chrome") console.log("SUCCESS 1")
        //x debug(search_str + " SEARCH STR")
        for (var i = 0; i < array_str.length; i++) { //array level...
            // v we're not interested in trailing chars past our search terms length, this is for proc grouping
            var cut_str = array_str[i].slice(0,search_str.length) //string level...
            if (search_str == cut_str) {
                var tail = array_str[i].slice(search_str.length)
                // v Check that our tail doesn't have regular alpha-numeric chars besides our parentheses
                // compare against decimal unicode table, basically if it's anything but what we use to label dupe procs it dq's the dupe
                var tail_exception = false
                var ii = 0
                while (!tail_exception && ii < tail.length) {
                    var my_char = tail.charCodeAt(ii)
                    if (( my_char < 40) || 
                        (my_char > 42 && my_char < 47) || 
                        my_char > 59 ) {
                            
                            tail_exception = true
                            //debug("TAIL EXCEPTION", tail, tail[ii], my_char) // I NEED to move to next iteration instead of returning
                            break

                    }
                    else ii++
                }
                // console.log ("TAIL: ", tail)
                if (!tail_exception) {
                    a.result = true
                    a.index = i
                    break
                }
            }
        }
        
        // if (search_str == "chrome") console.log("SUCCESS 3")
        // v Not even sure this is needed anymore
        //This double checks there's no '+' before the '('. This doesn't help for processes that have a '+' right
        //there positionally alongside a duplicate process, but with a longer filename. However, it still
        //takes care of the other edge case which is much more common - where the + is for long process filenames)
        // if (a.result) {
        //     var i = a.index 
        //     var start_pos = array_str[i].length //str level
        //     var parenth_pos = array_str[i].indexOf('(', i)
        //     start_pos = (parenth_pos > 0) ? parenth_pos : start_pos
        //     if (array_str[start_pos-1] == '+') a.result = false
        // }
        // if (search_str == "chrome" && a.result) console.log("SUCCESS 4 \n")

        return a
    }

    
    
    
    //Main data consolidation loop with details inline:
    collapse_data() { 
        debug(5)
        // debug(this.fc.columns[0], true)
        // debug(this.fc.columns[0][0].col_num, true)
        debug(5.5)
        
        // debug(this.fc.columns, true)
        var marked_for_del = [] //hash for all the rows of duplicate name columns        
        var marked_for_label = [] //hash for all the rows of duplicate name columns        
        this.fc.columns.forEach(function() { marked_for_del.push([]) 
                                             marked_for_label.push([]) 
                                            })
        

        for (var c = 0; c < this.fc.columns.length; c++) {
            var cache_data = this.fc.columns[c].cache
            // row to change | value to change to
            debug(c + ' = COLUMN NUM ' + cache_data.length)
            for (var i = 0; i < cache_data.length; i++) {
                var raw = this.extract_column(this.fc.columns[c].col_num, cache_data[i]) //Memory, cpu data
                // debug("INDEX:", i, ret)
                // debug("COLUMN NUM:" + this.fc.columns[c].col_num)
                // var extract_mem = decimal_round(parseFloat(ret) / 1000, 2) //Convert to MB ( / 1000) and adjust decimals
                // debug(6)
                // debug("RETURN: \'" + ret + "\'")
    
                if (this.fc.columns[c].conversion != null) { //conversion function check
                    //x console.log("CONVERSION != null")
                    raw = parseFloat(this.fc.columns[c].conversion(raw))
                }
                else raw = parseFloat(raw)
                // var raw = decimal_round(parseFloat(ret), 2) //value extraction, order is important here
                
                // values.forEach(el => console.log("VALUES",el))
            
     
                //May as well clean up the bottom of the name list... //x Should refactor this to the readfile stage...       
                if (cache_data.length - i < 2) { // only check last couple lines
                    if (this.fc.columns[c].my_name_data[i] == " " || this.fc.columns[c].my_name_data[i] == "" || !isString(this.fc.columns[c].my_name_data[i])) {
                        marked_for_del[c].push(true)
                        continue
                    }
                }

                //check for dupe
                var dupe = []
                dupe.push({result:false})
                // console.log("HI eye:", i)
                var tmp_str_array = this.fc.columns[c].my_name_data.slice(0, i) // clip name row array to only search up to our current index
                if (i != 0) { // v Start checking for duplicate
                    var dupe = this.contains(this.fc.columns[c].my_name_data[i], tmp_str_array)
                }

                this.fc.columns[c].numeric.push(decimal_round(parseFloat(raw), 2))
                marked_for_label[c].push(0)
                if (!dupe.result) {
                    marked_for_del[c].push(false)
                    //No dupe, new name, add new rows to our cpu/mem arrays
                }
                else { //"Duplicate" so add up totals...
                    marked_for_del[c].push(true)
                    marked_for_label[c][dupe.index] ++
                    
                    // console.log("LENGTH VS:",this.fc.columns[c].numeric.length, dupe.index, i) //x dupe.index is problem
                    var article = [this.fc.columns[c].numeric[dupe.index], raw] 
                    // article.forEach( (el, indy) => article[indy] = (el === null || el === undefined || isNaN(el)) ? 0 : parseFloat(el) )
                    var my_float = article.reduce((a, b) => a + b, 0) //sum single column array

                    debug("SUM:" + my_float + " DUPE:" + this.fc.columns[c].numeric[dupe.index] + " RAW:" + raw)
                    this.fc.columns[c].numeric[dupe.index] = decimal_round(my_float, 2)
                   
                }
            }
        }
    
        debug(6)    
        
        //Delete marked in the name arrays and build our lists
        for (var c = 0; c < this.fc.columns.length; c++) {
            var cache_my_name_data = []
            var cache_numeric_data = []
            var cache_marked_label = []
            // console.log (this.fc.columns[c].numeric.length, 'vs', this.fc.columns[c].my_name_data.length)
            for (var i = 0; i < this.fc.columns[c].my_name_data.length; i++) {
                if (!marked_for_del[c][i]) {
                    // if (marked_for_label)
                    cache_my_name_data.push(this.fc.columns[c].my_name_data[i])
                    cache_numeric_data.push(this.fc.columns[c].numeric[i])
                    cache_marked_label.push(marked_for_label[c][i])
                }

            }
            this.fc.columns[c].my_name_data = cache_my_name_data
            this.fc.columns[c].numeric = cache_numeric_data
            marked_for_label[c] = cache_marked_label
        }
    
        //Build Composite 1 list ready for sorting
        for (var c = 0; c < this.fc.columns.length; c++) {
            var name_len = this.fc.columns[c].my_name_data.length
            //slice off the ends of our mem and cpu lists to match the name list
            var my_numeric = this.fc.columns[c].numeric.slice(0,name_len) //this.fc.columns[c].numeric // variable names getting a little long..
            for (var i = 0; i < this.fc.columns[c].my_name_data.length; i++) {
                // my_numeric[i] = (my_numeric[i] === null || my_numeric[i] === undefined || isNaN(my_numeric[i])) ? 0 : my_numeric[i]
                var my_name = (marked_for_label[c][i] == 0) ? this.fc.columns[c].my_name_data[i] : this.fc.columns[c].my_name_data[i] + ':(' + (marked_for_label[c][i] + 1) + ')'
                this.fc.columns[c].composite1.push([my_name, my_numeric[i]])
                // this.fc.columns[c].numeric[i] = my_numeric
                // debug(my_numeric[i])
            }
        }
            
    }
   
    //basically a brute force element swapping function that gets around modifying arrays out of scope by deep cloning it first
    array_swap_element = function(arr, fromIndex, toIndex) {
        var toIndex_cache = arr[toIndex]
        var fromIndex_cache = arr[fromIndex]
        arr[fromIndex] = toIndex_cache
        arr[toIndex] = fromIndex_cache //x I need to look at this algo all over again because my_arr = modify_arr_func(my_arr) appears to work when I use node shell
        return arr
    }

    //Sort lists descending from the top-to-bottom by second column
    //Over complicated because of my current ignorance on JS array scope management
    //Basically, we're looking for the biggest number larger than us
    // - /w restarting the loop, resuming an inner loop, and array cloning when swapping rows
    my_sort = function () {
        //x debug(data_array.length)
        for (var c = 0; c < this.fc.columns.length; c++) {
  
            var shifts = 0
            var cache_array = this.fc.columns[c].composite1
            for (var i=0;i<cache_array.length;i++) {
                var mem_cont = cache_array[i][1]
                var mem_pos = i
                    
                for (var k=i+1;k<cache_array.length;k++) {
                    var next_seed = cache_array[k][1]
                    if (next_seed > mem_cont) {
                        mem_cont = next_seed
                        mem_pos = k
                    }                           
                }
                if (mem_pos != i) {
                    cache_array = this.array_swap_element(cache_array, i, mem_pos)
                    shifts++
                }
            }
            
            debug("Shifts: " + shifts)
            this.fc.columns[c].composite1 = cache_array
        }
    }

    giant_strings = function() {
        //Convert to one big string with '\n's instead of ','s (at least when they're written)
        
        for (var c = 0; c < this.fc.columns.length; c++) {
            var giant_string = ""
            // this.fc.columns[c].composite2 = []
            // debug(my_name_data.length + '\n' + my_proc_cpu_array + '\n' + my_proc_mem_array)
            var lines = (MAX_LINES > this.fc.columns[c].my_name_data.length) ? this.fc.columns[c].my_name_data.length : MAX_LINES
            //MAX_LINES
            for (var i = 0; i < lines; i++) {
                    //              name  v                     +    column data v
                    giant_string += this.fc.columns[c].composite1[i][0] + ' ' + this.fc.columns[c].composite1[i][1] + '\n'
            }
            this.fc.columns[c].composite2 = giant_string
        }
    }

    save_all() {
        //Save file
        if (mode != 0) {
        for (var c = 0; c < this.fc.columns.length; c++) {
            var path = this.fc.columns[c].dest
                debug('saving...')
                debug("PATH:" + path, this.fc.columns[c].composite2)
                my_write_file(path, this.fc.columns[c].composite2, file_retries)
            }
        }
    }

    print_all() {
        debug('data:')
        for (var c = 0; c < this.fc.columns.length; c++) {
            console.dir(this.fc.columns[c].composite1)
        }
    }

    //UTILITARY FUNCTION END
    
    
    fc = { // fc = file collection
        my_name_data:[], //this is kept out of fc because it is considered constant per run
        cache:[],
        srcfiles:[""],
        columns:[ { cache:null, //our og file read
                    my_name_data:[],
                    col_num:0,   //column number, should be 1 to 1 with destfiles & data //or just do this object style
                    conversion:null,  //conversion function (if applicable)
                    dest:"",
                    numeric:[],  //1 column numeric data from file
                    composite1:[],  //name + numeric ready for manip
                    composite2:[],  //giant str made up of str lines of name + numeric ready for file output
    
        } ]
    }

    constructor(fc) {
        this.fc = fc //? needed?
        // this.fc = deepCopy(fc) //? needed?
        debug(4)
        var f = 0
        // debug(this.fc.srcfiles.length)
        for (var c = 0; c < this.fc.columns.length; c++) {
            this.fc.columns[c].numeric = [] //just some initialization of arrays for push
            this.fc.columns[c].composite1 = [] 
            this.fc.columns[c].composite2 = []
            this.fc.columns[c].my_name_data = []
            var cache_data = my_read_file(this.fc.srcfiles[c], file_retries)
            cache_data = cache_data.split("\n")
            cache_data = cache_data.splice(header)

            //Get names really quick
            for (var i = 0; i < cache_data.length; i++) {
                var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)
                if (cache_string[cache_string.length-1] == '\n') {
                    cache_string = cache_string.pop() 
                }
                // debug(cache_string)
                this.fc.columns[c].my_name_data.push(cache_string) //dont need second arg for slice  
            }
            this.fc.columns[c].cache = cache_data
        }
        this.cache = this.fc.columns[0].cache
        this.my_name_data = this.fc.columns[0].my_name_data
        // this.fc.columns.forEach(el => console.log(el.cache))
            // debug(4.5)
            // this.collapse_data()
            // debug(8)
            // this.my_sort()
            // debug(8.5)
            // this.giant_strings()
            // debug(9)
            // this.save_all()
    }
}
/****************************************************************************************/

debug(3)

debug(file_collection)

if (FILE_SOURCE == "top") {
    var my_job = new data_fao({
        srcfiles: file_collection,
        columns: [ {col_num:6, conversion:function(el) {return decimal_round(el / 1000, 2)}, dest: destdir + ".redmem"},
                   {col_num:9, conversion:null,                                              dest: destdir + ".redcpu"},
        ] 
    })
}
else { //or ps
    var my_job = new data_fao({
        srcfiles: file_collection,
        columns: [ {col_num:1, conversion:function(el) {return decimal_round(el / 1000, 2)}, dest: destdir + ".redmem"},
                   {col_num:1, conversion:null,                                              dest: destdir + ".redcpu"},
            ] 
    })
}


debug(4.5)
my_job.collapse_data()
debug(8)
// console.log(my_job.fc.columns[0].composite1)
// console.log(my_job.fc.columns[1].composite1)
my_job.my_sort()
// console.log(my_job.fc.columns[0].composite1)
// console.log(my_job.fc.columns[1].composite1)
debug(8.5)
my_job.giant_strings()
debug(9)
my_job.save_all()



//Print output
if (mode != 1) {
    my_job.print_all()
}

// debug(my_name_data, my_cpu_data ,my_mem_data)


var verbose = function(){
    inform("\n")
    inform("mode: " + mode)
    inform("  0=Print\n -1=Both(output to /var/tmp)\n  2=User specified output\n  3=Zero and Two(Debug)")
    // inform("current setting:", mode,"\n")
    if (!output_success) inform("Destination Directory: " + destdir)
    if (mode != 0) {
        my_job.fc.columns.forEach(el => inform(el.destdir + ""))
        inform("File output success? : ")
        inform("\x1b[32m" + output_success.toString()+"\x1b[0m ")
    }
    else inform ("\nPrint complete")
} 
verbose()

debug("exiting...")
brisk_exit()



