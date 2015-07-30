var classifyDecode = require("../lib/classifyDecode.js")
var file = require("../lib/file.js")
var db = require("../lib/db.js")

var counter= 0

file.streamFile('/Volumes/Untitled/update_1.json',function(record,resume){


	counter++
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	console.log(record)

	db.updateBibRecord(record, resume)

	record = null
	resume = null


})

