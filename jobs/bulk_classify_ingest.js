var classifyDecode = require("../lib/classifyDecode.js")
var file = require("../lib/file.js")
var db = require("../lib/db.js")

var counter= 0

file.streamFile('/Users/matt/Downloads/update_1.json',function(record,resume){


	counter++
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	db.updateBibRecord(record, resume)

	record = null
	resume = null


})

