//simple script used to debug and prove that doing top code below breaks read/writeFileSync for some reason

const fs = require('fs')
var shell = require('child_process')

var content = 'Some content!'
var file_path = 'gmdcache'
var test_var = "-o %MEM"
shell.exec("top -o %MEM -b -n 1 > " + file_path) // piping, string addition, all works so narrowed down to top + piping
//shell.exec("top -o %MEM -b -n 1 > " + file_path) //appears to be top specific?
try {
  fs.writeFileSync('test.txt', content)
  content = ""
  //content = fs.readFileSync('test.txt', {encoding:'utf8'})
  content = fs.readFileSync(file_path, {encoding:'utf8'})
  console.log("Content:", content)
  fs.rmSync("test.txt")
  //file written successfully
} catch (err) {
  console.error(err)
}