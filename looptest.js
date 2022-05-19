const myargs = process.argv.slice(2) //remove file location columns 'node', './'

var len = myargs[0]
for (var i = 0; i < len; i++) {
    console.log(i**i)
}
console.log("ONE BIG POT")