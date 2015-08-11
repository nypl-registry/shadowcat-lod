var classifyDecode = require("../lib/classifyDecode.js")
var file = require("../lib/file.js")
var readable = require('stream').Readable
var fs = require("fs")



var fileIn = '/Volumes/Untitled/classify_13_results.json'
var fileOut = '/Users/matt/Downloads/update_13.json'



var rs = new readable({objectMode: true})
var outfile = fs.createWriteStream(fileOut)
rs._read = function () {}
rs.pipe(outfile)


var counter= 0



file.streamFile(fileIn,function(record,resume){


	counter++
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )


	if (record === null){
		rs.push(null)
		return false
	}



	classifyDecode.returnData(record,function(results){



		var update = {}


		//every record will be updated at least with the fact that it was checked
		update['sc:classifyCheck'] = '2015-07-15' 	//when this bulk ingest data was finsihed collected
		update['id'] = record.bnumber 	//when this bulk ingest data was finsihed collected



		//we also want to update and OCLC,ISBN,ISSN numbers taken out of the marc fields that we used for this search
		//there was a bug in the data where a handful of oclc numbers got a lower case 'b' added in

		var oclcNumbers = []
		record.oclc.forEach(function(n){
			n = n.replace(/b/gi,'').trim()
			n = parseInt(n)
			if ( isNaN(n)){
				console.log("Bad OCLC:",record)
			}else{
				if (oclcNumbers.indexOf(n) == -1) oclcNumbers.push(n)
			}
			
		})

		update['sc:oclc'] = oclcNumbers

		var isbnNumbers = []
		record.isbn.forEach(function(n){
			n = parseInt(n)
			if ( isNaN(n)){
				console.log("Bad ISBN:",record)
			}else{
				if (isbnNumbers.indexOf(n) == -1) isbnNumbers.push(n)
			}

		})

		update['sc:isbn'] = isbnNumbers
		update['sc:issn'] = record.issn


		//if the there was no match on an identifier we try to do a title/author lookup, if that was 
		//sucessfull and we think we found a title that matches add the oclc info to the record
		if (results.addOclcNumberOnly){
			update['classify:oclc'] = [parseInt(results.data)]
		}

		//we have a sucessfull match data for this record, add all the fields into the update
		if (results.addClassifyData){


			update['classify:oclc'] = [parseInt(results.data.oclcNumber)]
			update['classify:editions'] = parseInt(results.data.editions)
			update['classify:eholdings'] = parseInt(results.data.eholdings)
			update['classify:format'] = results.data.format
			update['classify:holdings'] = parseInt(results.data.holdings)
			update['classify:itemtype'] = results.data.itemtype
			update['classify:owi'] = parseInt(results.data.owi)

			var naf = []
			var viaf = []

			for (var x in results.data.authors){
				if (results.data.authors[x].lc) naf.push(results.data.authors[x].lc)
				if (results.data.authors[x].viaf) viaf.push(results.data.authors[x].viaf)
			}



			update['classify:creatorLC'] = naf
			update['classify:creatorVIAF'] = viaf
			update['classify:fast'] = results.data.fast
			update['classify:dcc'] = (results.data.ddc === false) ? false : parseFloat(results.data.ddc)
			update['classify:lcc'] = (results.data.lcc === false) ? false : results.data.lcc




		}


		if (results.possibleOclcNumberOnly){
			//update['classify:oclc'] = [parseInt(results.data)]

			//there was no conclusive match (title only match)
			//so store away the possiblities 

			update['classify:closeMatch'] = results.data		


		}


		rs.push(JSON.stringify(update) + "\n")

		resume()


	})




})

