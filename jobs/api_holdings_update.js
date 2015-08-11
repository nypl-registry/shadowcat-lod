var db = require("../lib/db.js")
var apiHoldings = require("../lib/apiHoldings.js")
var async = require('async')


var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/api_holdings_update.log');


var work = function(cb){



	db.returnNextApiHoldingsWork(function(err,doc){

		if (err) console.log(err)



		if (doc) doc = doc[0]
		//do the requests
		var atNYPL = []


		log.info(doc['_id']," Started working on.")



		async.each(doc.closeMatch, function(match, callback) {

			apiHoldings.checkOclcHoldingsTwoPagesForNYPL(match.oclcNumber,'10016',function(results){
				if (results.all){
					atNYPL.push(match)
				}
				callback()
			})		

		}, function(err){
			// if any of the file processing produced an error, err would equal that error
			if( err ) {

				log.info(doc['_id'],"Error:",err)

				//call the next one
				work()



			} else {



				if (atNYPL.length == 0){

					log.info(doc['_id']," No holding records found.")

					//if there were no matches that means that we cannot say for sure which one it is
					//so leave everything the way it is 
					db.deleteApiHoldingsWork(doc['_id'],function(err,results){
						if (err) log.info(doc['_id']," Error:",err)
						work()
					})

				}else if(atNYPL.length == 1){

					log.info(doc['_id']," One record found, setting oclc number: ",parseInt(atNYPL[0].oclcNumber))


					var updateRecord = {
						id : doc['_id'],
						'classify:oclc' : [parseInt(atNYPL[0].oclcNumber)],
						'classify:closeMatch' : []
					}

					//if there is exactly one match that is our keeper update the classify oclc number in the record and clear out the closematches
					db.updateBibRecord(updateRecord,function(err,r){


						//we want to delete this record from the work table so the next work call gets the next one in line to work
						db.deleteApiHoldingsWork(doc['_id'],function(err,results){
							if (err) log.info(doc['_id'],"Error:",err)
							work()
						})


					})



				}else{


					log.info(doc['_id']," Multiple records found : ",atNYPL.length)

					//more than one
					//we want to update the bib with close matchs that worked, to narrow down the choice later
					var updateRecord = {
						id : doc['_id'],
						'classify:closeMatch' : atNYPL
					}

					//if there is exactly one match that is our keeper update the classify oclc number in the record and clear out the closematches
					db.updateBibRecord(updateRecord,function(err,r){


						//we want to delete this record from the work table so the next work call gets the next one in line to work
						db.deleteApiHoldingsWork(doc['_id'],function(err,results){
							if (err) log.info(doc['_id']," Error:",err)
							work()
						})


					})

				}


			}

		})




	})




}

work()