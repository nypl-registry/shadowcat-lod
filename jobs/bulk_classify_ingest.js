var classifyDecode = require("../lib/classifyDecode.js")
var file = require("../lib/file.js")
var db = require("../lib/db.js")


var counter= 0





db.returnBibCollection(function(err,collection,connection){


	file.streamFile('/Users/matt/Downloads/update_13.json',function(record,resume){

		counter++
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write( counter + "" )


		if (record){
			
			collection.update({ _id : record.id }, { $set: record }, function(err, result) {

				if (err) console.log("ERROR:",err)

				console.log(result.result)

				resume()
				record = null
				resume = null

				return false

			})

		}else{
			connection.close()
		}


		return false


	})
	

})


