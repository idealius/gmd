/* Purpose

Make easy to read output files containing totals for current CPU and MEM usage ostensibly used for Conky.

*/



/* Usage

gmd folder
//export topmem and topcpu to destination folder

gmd
//print to std out thru console.log

gmd -1
//both, saved to /var/tmp/topmem and topcpu

*/
'use strict'



const { strictEqual } = require('assert')
const { isNullOrUndefined } = require('util')
var shell = require('child_process')
var myfile = require('fs')
var mode = 1
var destdir
var top_data
var my_name_data = []
var my_cpu_data = []
var my_mem_data = []

//Schema level functions
String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}
//Schema End

//x console.log(myargs)

const myargs = process.argv.slice(2) //remove file location columns
switch (myargs[0]) {
    case undefined:
    case "":
        mode = 0 //print
        console.log("Print mode")
        break
    case "-1":
        mode = 2 //both
        destdir = "/var/tmp/"
        console.log("Print and Save mode")
        break
    default:
        mode = 2 //x1 for release 2 for debug | save files /w user provided dir
        destdir = myargs[0]
        if (destdir[destdir.length-1] != '/') destdir = destdir + '/'
        console.log("File output mode")
        break
}


shell.exec("top -o %MEM -b -n 1 > /var/tmp/gmdcache") // -o %MEM is more for preference and changes little

top_data = myfile.readFileSync('/var/tmp/gmdcache', {encoding:'utf8'})
//x console.log(top_data)


var cache_data = top_data.split("\n")
cache_data = cache_data.splice(7)

    //walk backwards for name
for (var i = 0; i < cache_data.length; i++) {
    var cache_string = cache_data[i].slice(cache_data[i].lastIndexOf(" ")+1)

    my_name_data.push(cache_string) //dont need second arg for slice apparently 
    //x console.log(my_data[i])
}


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
        //x console.log(a, b)
        a++
    }
    var ret = source_array.slice(a, b)
    ret = (ret === null || ret === undefined || isNaN(ret)) ? 0 : ret //x debug
    //x console.log(ret)
    return ret
}


//checks array for duplicate element, returns two vars: .result and .value
var duplicate = function(search_str, array_str) {
    var a = {
        result: false,
        value: 0
    }

    for (var i = 0; i < array_str.length; i++) {
        if (search_str == array_str[i]) {
            a.result = true
            a.value = i
            break
        }
    }

    return a
}



var decimal_round = function(num, prec) {
    console.log(num)
    var num_str = num.toString()
    var dec = 0
    prec++
    
    while (num_str[dec] != '.' && dec < num_str.length) dec++ //find decimal point position


    console.log("Hi", num_str, num_str.length)
    if (dec + prec >= num_str.length) return parseFloat(num_str) //decimal not long enough anyway / no trailing digit

    var last_digit = parseInt(num_str[dec + prec - 1])
    var trailing_digit = parseInt(num_str[dec + prec])

    if (trailing_digit > 4) { // >4 we round up
        console.log("round up")
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
    console.log("Hmm:",num_str)
    return parseFloat(num_str)
}

//Functions END


//Consolidation and collating our data:

var marked_for_deletion = [] //kind of a hacky way to do this part later but w/e

//Loop where we either...

for (var i = 0; i < cache_data.length; i++) {
    
    var ret = extract_column(6, cache_data[i])
    var extract_mem = decimal_round(parseFloat(ret) / 3, 2) //Convert to MB from KB and adjust decimals
    
    ret = extract_column(9, cache_data[i])
    var extract_cpu = parseFloat(ret)

    var tmp_str_array = my_name_data.slice(0, i) // clip array to only search up to our current index
    
    //May as well clean up the bottom of the name list...
    if (my_name_data[i] == " " || my_name_data[i] == "") {
        marked_for_deletion.push(true)
        continue
    }
    
    var dupe = []
    dupe.push({result:false})
    if (i != 0) { //We got a duplicate here?
        var dupe = duplicate(my_name_data[i], tmp_str_array)
        var value = dupe.value
    }
    // else { //bail if it's the first index...
    //     dupe.result = false
    // }

    if (dupe.result) { //Duplicate so add up totals...
        
        //BUG Why is this data checking necessary? (starts, here actually do it later) v v v BUG
        // my_mem_data[value] = (my_mem_data[value] === null || my_mem_data[value] === undefined || isNaN(my_mem_data[value])) ? 0 : my_mem_data[value] 
        // my_cpu_data[value] = (my_cpu_data[value] === null || my_cpu_data[value] === undefined || isNaN(my_cpu_data[value])) ? 0 : my_cpu_data[value] 
        
        console.log(':' + value, my_name_data[value], my_mem_data[value], my_cpu_data[value]) //x debug
        //x if (value >= my_mem_data.length) console.log("WTF?") //x debug lol
        var my_float = my_mem_data[value] + extract_mem
        my_mem_data[value] = decimal_round(my_float, 2)
        //x console.log(my_float)

        my_float = my_cpu_data[value] + extract_cpu
        my_cpu_data[value] = decimal_round(my_float, 2)
        // console.log('{' + value, my_name_data[value], my_mem_data[value], my_cpu_data[value]) //x debug
        marked_for_deletion.push(true)
    }
    else { //New name, add new rows to our cpu/mem arrays

        my_mem_data.push(extract_mem)
        my_cpu_data.push(extract_cpu)
        marked_for_deletion.push(false)
    }
}

//x console.log("LENGTHS:", my_name_data.length, my_mem_data.length)


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
//x console.log("LENGTHS:", my_name_data.length, my_mem_data.length)

for (var i = 0; i < my_name_data.length; i++) {
    // console.log(':' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
     //x Why is this necessary? v v v
    my_mem_data[i] = (my_mem_data[i] === null || my_mem_data[i] === undefined || isNaN(my_mem_data[i])) ? 0 : my_mem_data[i] 
    my_cpu_data[i] = (my_cpu_data[i] === null || my_cpu_data[i] === undefined || isNaN(my_cpu_data[i])) ? 0 : my_cpu_data[i] 
     
    my_proc_mem_array.push([my_name_data[i], my_mem_data[i]])
    my_proc_cpu_array.push([my_name_data[i], my_cpu_data[i]])
    // console.log('.' + my_name_data[i], my_mem_data[i], my_cpu_data[i]) //x debug
}

//For deep copying arrays
function nestedCopy(array) {
    return JSON.parse(JSON.stringify(array));
}

function arraymove(arr, fromIndex, toIndex) {
    var toIndex_cache = arr[toIndex]
    var fromIndex_cache = arr[fromIndex]
    var replacement = nestedCopy(arr)
    replacement[fromIndex] = toIndex_cache
    replacement[toIndex] = fromIndex_cache
    console.log("Successfully moved row..")
    return replacement
}

//Sort lists descending from the top-to-bottom by second column
//Over complicated because of my current ignorance on JS array scope management
//Basically, we're looking for a bigger number than us, and if it is we swap places as
//we iterate down - /w restarting the loop, resuming an inner loop, and array cloning when necessary
var my_sort = function (data_array) {
    //x console.log(data_array.length)
    var start_over
    var done = false
    var passes = 0
    var cache_array
    var i_start_pos = 0

    while(!done) {
        start_over = false
        console.log(passes++)
        for (var i=i_start_pos;i<data_array.length;i++) {
            for (var c=data_array.length-1;c>=0;c--) {
                if (c > i && data_array[c][1] > data_array[i][1]) {
                    cache_array = arraymove(data_array, i, c)
                    //x console.log("Move from row:", i + " to " + c)
                    start_over = true //without knowing details this is necessary since we're looping and modifying an array at the same time
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
            }
        }
        //x console.log(data_array)
    }
    
    return cache_array
}

//my_proc_cpu_array.sort()
// my_proc_mem_array.sort(sortFunction);
//x console.log(my_proc_cpu_array)
my_proc_mem_array = my_sort(my_proc_mem_array)
my_proc_cpu_array = my_sort(my_proc_cpu_array)


//Save file
if (mode != 0) {
    //Convert to one big string with '\n's instead of ','s (at least when they're written)
    var giant_cpu_string = ""
    var giant_mem_string = ""
    console.log(my_name_data.length, my_proc_cpu_array.length)

    for (var i = 0; i < my_name_data.length; i++) {
            giant_cpu_string += my_proc_cpu_array[i][0] + ' ' + my_proc_cpu_array[i][1] + '\n'
            giant_mem_string += my_proc_mem_array[i][0] + ' ' + my_proc_mem_array[i][1] + '\n'
      
    }
    

    //x for (var i = 0; i < my_name_data.length; i++)
    // {
    //     giant_cpu_string += my_name_data[i] + ' ' + my_cpu_data[i] + '\n'
    //     giant_mem_string += my_name_data[i] + ' ' + my_mem_data[i] + '\n'
    // }



    //console.log(giant_mem_string)
    myfile.writeFileSync(destdir + "topcpu", giant_cpu_string);
    myfile.writeFileSync(destdir + "topmem", giant_mem_string);
    // myfile.writeFileSync(destdir + "topmem", my_proc_mem_array);
}

//Print output
if (mode != 1) {
    console.log(my_proc_mem_array, my_proc_cpu_array)

}

// console.log(my_name_data, my_cpu_data ,my_mem_data)




function verbose() {
    console.log("\n")
    console.log("mode: Save=0 Print=1 Both=-1")
    console.log("current setting:", mode,"\n")
    console.log("Destination Directory:", destdir)
    console.log(destdir + "topmem & cpumem", "\n")
} verbose()

console.log("Done")




