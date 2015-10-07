var db = require("../lib/db.js")
var cluster = require('cluster')
var config = require("config")
var request = require('request')
var async = require("async")
var worldcatDecode = require("../lib/worldcatDecode.js")
var Moniker = require('moniker')


var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/worldcat.log');
var count = 0
var dataStore = {}
var workers = {}
var workerMax = config['WorldcatWorkerCount']

if (cluster.isMaster) {

	var updatingRecordsInMongo = false


	setInterval(function(){
		log.info('Work Update. total: ', count)
	},300000)


	//every 30 sec check for completed records and update the mongo datastore, get new records
	setInterval(function(){


		if (updatingRecordsInMongo) return false

		updatingRecordsInMongo = true

		var updateStartTime = (new Date).getTime()

		console.log("starting record update")


		db.updateWorldcatData(dataStore, updateStartTime, function(err,results){


			//remove the completed records that are now updated in mongo
			for (var x in dataStore){
				if (dataStore[x].complete && dataStore[x].completeTime < updateStartTime) delete dataStore[x]
			}

			updatingRecordsInMongo = false

			console.log("done Updating, there are", Object.keys(dataStore).length, " records left in the queue to work")

			//keep 1000 in the queue
			if (Object.keys(dataStore).length < 5000){

				console.log("Asking for more records")

				//this can happen async
				db.returnNextApiWorldcatWork(function(err,doc){

					if (err) console.log(err)

					for (var x in doc){
						if (!dataStore[doc[x]._id]){
							dataStore[doc[x]._id] = doc[x]
							dataStore[doc[x]._id].working = false
							dataStore[doc[x]._id].complete = false
						}
					}

					console.log("there are", Object.keys(dataStore).length, " now in the queue to work")

				})


			}


			//update the bot report
			db.updateBotReport(workers);




		})



	},30000)








	//load in data
	db.returnNextApiWorldcatWork(function(err,doc){

		if (err) log.info(err)

		for (var x in doc){
			if (!dataStore[doc[x]._id]){
				dataStore[doc[x]._id] = doc[x]
				dataStore[doc[x]._id].working = false
				dataStore[doc[x]._id].complete = false
			}
		}

		if (Object.keys(dataStore).length === 0){
			log.info('No work in the worldcat collection')
			setTimeout(function(){
				process.exit()
			},1000)
		}


		var buildWorker = function(){

			setTimeout(function(){

				var worker = cluster.fork();

				//console.log(worker)

				log.info('Spawing worker:',worker.id)

				workers[worker.id] = {}

				workers[worker.id].born = Math.floor((new Date).getTime()/1000)

				workers[worker.id].name = Moniker.choose()
				workers[worker.id].totalRequests = 0
				workers[worker.id].totalSucessfulMatches = 0
				workers[worker.id].totalFailedMatches = 0
				workers[worker.id].totalBytes = 0
				workers[worker.id].quest = "OCLC Worldcat work"
				workers[worker.id].lastTask = ""


				worker.on('message', function(msg) {

					
					if (msg.req) {

						workers[worker.id].lastActivity = Math.floor((new Date).getTime()/1000)


						//console.log("Worker#", msg.req.id, "Asking for work");

						if (msg.req.results){

							//completed one
							//console.log("Worker#", msg.req.id, " completed ", msg.req.record._id)

							
							dataStore[msg.req.record._id].results = msg.req.results

							workers[worker.id].totalRequests = workers[worker.id].totalRequests + msg.req.record.totalRequests
							workers[worker.id].totalBytes = workers[worker.id].totalBytes + msg.req.record.totalBytes


							//process the results into an update object to put into mongo


							var update = {}
							var results = msg.req.results
							results.bnumber = msg.req.record._id


							var today = new Date();
							var dd = today.getDate();
							var mm = today.getMonth()+1; //January is 0!
							var yyyy = today.getFullYear();

							if(dd<10) {
							    dd='0'+dd
							} 

							if(mm<10) {
							    mm='0'+mm
							} 

							today = yyyy + '-' + mm + '-' + dd

							//every record will be updated at least with the fact that it was checked
							update['sc:worldcatCheck'] = today 	//when this bulk ingest data was finsihed collected
							update['id'] = results.bnumber 	//when this bulk ingest data was finsihed collected

							update['wc:aboutFast'] = results.aboutFast
							update['wc:aboutLcsh'] = results.aboutLcsh
							update['wc:aboutViaf'] = results.aboutViaf
							update['wc:contributor'] = results.contributor
							update['wc:creator'] = results.creator
							update['wc:datePublished'] = results.datePublished
							update['wc:genre'] = results.genre


							dataStore[msg.req.record._id].update = update

							workers[worker.id].totalSucessfulMatches++
							workers[worker.id].lastTask = 'I pulled the RDF for <a href="http://www.worldcat.org/oclc/' + msg.req.record.oclc[0] + '">http://www.worldcat.org/oclc/' + + msg.req.record.oclc[0] + '</a>'

							dataStore[msg.req.record._id].complete = true

							dataStore[msg.req.record._id].completeTime = (new Date).getTime()

							//console.log("---------------")

							//console.log(update)

							for (var x in dataStore){
								if (!dataStore[x].working && !dataStore[x].working.complete){
									dataStore[x].working = true
									worker.send({ req: { record: dataStore[x] } })
									return true
								}
							}



						}



						//find one in our queue that is not complete yet
						for (var x in dataStore){
							if (!dataStore[x].working && !dataStore[x].working.complete){
								dataStore[x].working = true
								worker.send({ req: { record: dataStore[x] } })
								return true
							}
						}

						//no work if we got here
						worker.send({ req: { die: true } })


					}

				});


			}, Math.floor(Math.random() * (10000 - 0))   )

		}


		//make sure they restart if they hit a bad record
		cluster.on('exit', function(worker, code, signal) {

			if (workers[worker.process.pid]){
				workers[worker.process.pid].lastTask = "I died :( | Error: " +   code + ' | ' + signal
			}


			cluster.fork();
		});




		for (var i = 1; i <= workerMax; i++) {
			workers[i.toString()] = { complete : 0 }
			buildWorker()
		}




	})



}else{

	var activeRecord = false
	var foundSomething = false
	var finished = false
	var results = []
	var internalCounter = 0, internalCounterLast = 0

	var debug = false
	

	setInterval(function(){			
		if (internalCounter === internalCounterLast){
			console.log("Worker #" + cluster.worker.id + " I havent done anything in 30 seconds, quiting")
			process.exit(0)
		}else{
			internalCounterLast = internalCounter
		}
	},30000)


	var requestDecode = function(oclcNumber,contentType,cb){

		//'text/plain' 


		var url = "http://www.worldcat.org/oclc/" + oclcNumber

		request({ headers: { accept: contentType }, encoding: "utf8",  uri: url}, function (error, response, body) {

			if (!error && response.statusCode == 200) {

				activeRecord.totalRequests++
				activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

				//process the results
				worldcatDecode.returnData(oclcNumber,body,function(err,parseReults1){

					// if (err){
					// 	console.log("Decode ERROR:",url + " | " + contentType)
					// 	console.log(err)
					// 	console.log("-------------")
					// 	console.log(parseReults1)
					// 	console.log("-------------")
						
					// }

					

					//if there was parse error it doesn't really matter, it likely got a lot of the data out of it
					cb(parseReults1)

				})


			}else if (response.statusCode == 403 || response.statusCode == 500) {

				//try it again after waiting a few
				setTimeout(function(){

					request({ headers: { accept: contentType }, encoding: "utf8",  uri: url}, function (error, response, body) {

						if (!error && response.statusCode == 200) {

							activeRecord.totalRequests++
							activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

							//process the results
							worldcatDecode.returnData(oclcNumber,body,function(err,parseReults2){

								// if (err){
								// 	console.log("Network Error retry Decode ERROR:",url + " | " + contentType)
								// 	console.log(err)
								// 	console.log("-------------")
								// 	console.log(parseReults2)
								// 	console.log("-------------")									
								// }

								
								//if there was parse error it doesn't really matter, it likely got a lot of the data out of it
								cb(parseReults2)

							})

						}else{

							log.info("Second Network error:" , url  +  JSON.stringify(error) +  JSON.stringify(response.statusCode) )
							
							cb(false)



						}

					})


				},750)



			}else{

				log.info("Network error:" , url  +  JSON.stringify(error) +  JSON.stringify(response.statusCode) )
				//setTimeout(function(){
					cb(false)
				//}, 200)

			}

		})

	}




	var processRecord = function(msg) {



		if (msg.req.die){
			log.info('Worker #',cluster.worker.id, " No work found, sleeping for 5min.")
			setTimeout(function(){
				process.send({ req: {id: cluster.worker.id} })
			},300000)
		}



		if (msg.req.record){

			//console.log("Working on", msg.req.record._id)

			activeRecord = msg.req.record
			activeRecord.totalRequests = 0
			activeRecord.totalBytes = 0

			foundSomething = false
			finished = false
			results = []


			async.eachSeries(activeRecord.oclc, function(oclcNumber, callback){

				//first try n triples
				requestDecode(oclcNumber, 'text/plain', function(requestDecodeResults){


					internalCounter++
					//this is setup to do multiple seriealizations if one fails, but the n-triple is pretty stable
					//not worth the extra bandwith time to try the others
					if (requestDecodeResults===false){

						log.info("No data found for:",oclcNumber)

					}else{
						results.push(requestDecodeResults)
						callback()
					}

					// if (requestDecodeResults===false){
						
					// 	//try turtle
					// 	requestDecode(oclcNumber, 'text/turtle', function(requestDecodeResults){

					// 		if (requestDecodeResults===false){

					// 			//try turtle
					// 			requestDecode(oclcNumber, 'application/ld+json', function(requestDecodeResults){

					// 				if (requestDecodeResults===false){
					// 					//other options? TODO
					// 				}else{
					// 					results.push(requestDecodeResults)										
					// 				}

					// 				callback()
					// 			})
					// 		}else{
					// 			results.push(requestDecodeResults)
					// 			callback()
					// 		}
					// 	})
					// }else{
					// 	results.push(requestDecodeResults)
					// 	callback()
					// }


				})




			}, function(error){



				var aboutFast = [], aboutLcsh = [], aboutViaf = []
				var contributor = []
				var creator = []
				var datePublished = []
				var genre = []




				var finalUpdate ={
					aboutFast : [],
					aboutLcsh : [],
					aboutViaf : [],
					contributor : [],
					creator : [],
					datePublished : [],
					genre : []
				}

				for (var aResult in results){

					var aResult = results[aResult]

					for (var z in aResult.aboutFast){
						var r = aResult.aboutFast[z]
						r = r.split('/fast/')[1]
						if (aboutFast.indexOf(r) == -1){
							finalUpdate.aboutFast.push(  { id : parseInt(r),  name: aResult.labelLookup[aResult.aboutFast[z]] }  )
							aboutFast.push(r)
						}
					}


					for (var z in aResult.aboutViaf){
						var r = aResult.aboutViaf[z]
						r = r.split('/viaf/')[1]
						if (aboutViaf.indexOf(r) == -1){
							finalUpdate.aboutViaf.push(  { id : parseInt(r),  name: aResult.labelLookup[aResult.aboutViaf[z]] }  )
							aboutViaf.push(r)
						}

					}

					for (var z in aResult.aboutLcsh){
						var r = aResult.aboutLcsh[z]
						r = r.split('/subjects/')[1]
						if (aboutLcsh.indexOf(r) == -1){
							finalUpdate.aboutLcsh.push(  { id : r,  name: aResult.labelLookup[aResult.aboutLcsh[z]] }  )
							aboutLcsh.push(r)
						}

					}


					for (var z in aResult.contributor){
						var r = aResult.contributor[z]
						r = r.split('/viaf/')[1]
						if (contributor.indexOf(r) == -1){
							finalUpdate.contributor.push(  { id : parseInt(r),  name: aResult.labelLookup[aResult.contributor[z]] }  )
							contributor.push(r)
						}

					}

					for (var z in aResult.creator){
						var r = aResult.creator[z]
						r = r.split('/viaf/')[1]
						if (creator.indexOf(r) == -1){
							finalUpdate.creator.push(  { id : parseInt(r),  name: aResult.labelLookup[aResult.creator[z]] }  )
							creator.push(r)
						}

					}

					for (var z in aResult.datePublished){
						var r = aResult.datePublished[z]
						if (datePublished.indexOf(r) == -1){

							if (r.trim() != ''){
								finalUpdate.datePublished.push(  r )
								datePublished.push(r)
							}
						}

					}
					for (var z in aResult.genre){
						var r = aResult.genre[z]
						if (genre.indexOf(r) == -1){
							if (r.trim() != ''){
								finalUpdate.genre.push(  r )
								genre.push(r)
							}
						}

					}
				}

				// if (finalUpdate.aboutFast.length == 0 && finalUpdate.aboutLcsh.length == 0 && finalUpdate.aboutViaf.length == 0 && finalUpdate.contributor.length == 0 && finalUpdate.creator.length == 0 && finalUpdate.datePublished.length == 0 && finalUpdate.genre.length == 0 ){
				// 	console.log("No Results!",activeRecord.oclc, activeRecord._id)
				// 	console.log(results)
				// }

				process.send({ req: {results: finalUpdate, record: activeRecord,  id: cluster.worker.id} });


			})

		}

	}




	process.on('message', processRecord)


	//first request
	process.send({ req: {complete: activeRecord, id: cluster.worker.id} })



}	


