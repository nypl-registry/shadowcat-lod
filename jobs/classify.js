var db = require("../lib/db.js")
var cluster = require('cluster')
var config = require("config")
var request = require('request')
var async = require("async")
var classifyDecode = require("../lib/classifyDecode.js")
var Moniker = require('moniker')


var log = require('simple-node-logger').createSimpleLogger(__dirname + '/../log/classify.log');
var count = 0
var dataStore = {}
var workers = {}
var workerMax = config['ClassifyWorkerCount']


var urlOclc = "http://classify.oclc.org/classify2/Classify?oclc={ID}"
var urlIsbn = "http://classify.oclc.org/classify2/Classify?isbn={ID}"
var urlIssn = "http://classify.oclc.org/classify2/Classify?issn={ID}"
var urlTitleAuthor = "http://classify.oclc.org/classify2/Classify?author={author}&title={title}"
var urlTitle = "http://classify.oclc.org/classify2/Classify?title={title}"


if (cluster.isMaster) {

	var updatingRecordsInMongo = false


	setInterval(function(){
		log.info('Work Update. total: ', count)
	},300000)


	//every 30 sec check for completed records and update the mongo datastore, get new records
	setInterval(function(){

		if (updatingRecordsInMongo) return false

		updatingRecordsInMongo = true

		console.log("starting record update")


		db.updateClassifyData(dataStore, function(err,results){


			//remove the completed records that are now updated in mongo
			for (var x in dataStore){
				if (dataStore[x].complete) delete dataStore[x]
			}

			updatingRecordsInMongo = false

			console.log("done Updating, there are", Object.keys(dataStore).length, " records left in the queue to work")

			//keep 1000 in the queue
			if (Object.keys(dataStore).length < 1000){

				console.log("Asking for more records")

				//this can happen async
				db.returnNextApiClassifyWork(function(err,doc){

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
	db.returnNextApiClassifyWork(function(err,doc){

		if (err) log.info(err)

		for (var x in doc){
			if (!dataStore[doc[x]._id]){
				dataStore[doc[x]._id] = doc[x]
				dataStore[doc[x]._id].working = false
				dataStore[doc[x]._id].complete = false
			}
		}

		if (Object.keys(dataStore).length === 0){
			log.info('No work in the apiClassify collection')
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
				workers[worker.id].totalBytes = 0
				workers[worker.id].quest = "OCLC Classify work"
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
							update['sc:classifyCheck'] = today 	//when this bulk ingest data was finsihed collected
							update['id'] = results.bnumber 	//when this bulk ingest data was finsihed collected


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


							dataStore[msg.req.record._id].update = update

							if (update['classify:owi']){
								workers[worker.id].lastTask = 'I matched <a href="http://catalog.nypl.org/record=' + results.bnumber +'">b'+ results.bnumber  +'</a>' + ' to <a href="http://classify.oclc.org/classify2/ClassifyDemo?owi=' + update['classify:owi'] +'">owi:'+ update['classify:owi']  +'</a>'
							}else{
								workers[worker.id].lastTask = 'I was not able to match <a href="http://catalog.nypl.org/record=' + results.bnumber +'">b'+ results.bnumber  +'</a> :('
							}

							dataStore[msg.req.record._id].complete = true

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

	var debug = false
	


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


			if (activeRecord.title){
				activeRecord.title = activeRecord.title.replace(/\[electronic resource\]/gi,'').replace(/\s+/,' ')
			}


			if (activeRecord.oclc.length>0){

				//we want to grab all the oclc responses and end if we have any non zero responses

				async.eachSeries(activeRecord.oclc, function(oclcNumber, callback){
					var url = urlOclc.replace('{ID}',oclcNumber)
					if (debug) console.log(url)
					request({ encoding: "utf8",  uri: url}, function (error, response, body) {

						if (!error && response.statusCode == 200) {

							activeRecord.totalRequests++
							activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

							//did we get a hit?
							if (body.search('<response code="2"')>-1) foundSomething = true
							results.push(body)
						}else{
							if (debug) console.log("Request ERROR:",response.statusCode,error)
						}

						callback()

					})



				}, function(error){


					if (!foundSomething){


						// we did not get a single match on the oclc numbers try isbn and then issn


						async.eachSeries(activeRecord.isbn, function(isbnNumber, callback){
							var url = urlIsbn.replace('{ID}',isbnNumber)
							if (debug) console.log(url)
							request({ encoding: "utf8",  uri: url}, function (error, response, body) {

								if (!error && response.statusCode == 200) {

									activeRecord.totalRequests++
									activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

									//did we get a hit?
									if (body.search('<response code="2"')>-1) foundSomething = true
									results.push(body)
								}else{
									if (debug) console.log("Request ERROR:",response.statusCode,error)
								}

								callback()

							})



						}, function(error){


							async.eachSeries(activeRecord.issn, function(issnNumber, callback){
								var url = urlIssn.replace('{ID}',issnNumber)
								if (debug) console.log(url)
								request({ encoding: "utf8",  uri: url}, function (error, response, body) {

									if (!error && response.statusCode == 200) {

										activeRecord.totalRequests++
										activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

										//did we get a hit?
										if (body.search('<response code="2"')>-1) foundSomething = true
										results.push(body)
									}else{
										if (debug) console.log("Request ERROR:",response.statusCode,error)
									}

									callback()

								})



							}, function(error){

								//if we did not find something after all of that then try the title and author
								if (!foundSomething){


									if (activeRecord.title && activeRecord.author){
										var url = urlTitleAuthor.replace('{title}',encodeURIComponent(activeRecord.title)).replace('{author}',encodeURIComponent(activeRecord.author))
									}else{
										var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
									}

									request({ encoding: "utf8",  uri: url}, function (error, response, body) {

										if (!error && response.statusCode == 200) {

											activeRecord.totalRequests++
											activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')											
											//did we get a hit?
											if (body.search('<response code="2"')>-1) foundSomething = true

											results.push(body)
										}else{
											if (debug) console.log("Request ERROR:",response.statusCode,error)
										}

										//did we find nothing, try just the title
										if (activeRecord.author && foundSomething == false){

											var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
											request({ encoding: "utf8",  uri: url}, function (error, response, body) {

												activeRecord.totalRequests++
												activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')


												if (!error && response.statusCode == 200) {
													//did we get a hit?
													if (body.search('<response code="2"')>-1) foundSomething = true

													results.push(body)
												}else{
													if (debug) console.log("Request ERROR:",response.statusCode,error)
												}

												finished = true

											})



										}else{
											finished = true
										}



									})


								}else{

									finished = true

								}

							})

						})


					}else{

						//we are good
						finished = true

					}

				})



			}else if (activeRecord.isbn.length>0 || activeRecord.issn.length>0){


				//no OCLC but it has isbn or issn


				async.eachSeries(activeRecord.isbn, function(isbnNumber, callback){
					var url = urlIsbn.replace('{ID}',isbnNumber)
					if (debug) console.log(url)
					request({ encoding: "utf8",  uri: url}, function (error, response, body) {


						if (!error && response.statusCode == 200) {

							activeRecord.totalRequests++
							activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

							//did we get a hit?
							if (body.search('<response code="2"')>-1) foundSomething = true
							results.push(body)
						}else{
							if (debug) console.log("Request ERROR:",response.statusCode,error)
						}

						callback()

					})



				}, function(error){

					//try the issn as well
					async.eachSeries(activeRecord.issn, function(issnNumber, callback){
						var url = urlIssn.replace('{ID}',issnNumber)
						if (debug) console.log(url)
						request({ encoding: "utf8",  uri: url}, function (error, response, body) {

							if (!error && response.statusCode == 200) {

								activeRecord.totalRequests++
								activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')

								//did we get a hit?
								if (body.search('<response code="2"')>-1) foundSomething = true
								results.push(body)
							}else{
								if (debug) console.log("Request ERROR:",response.statusCode,error)
							}

							callback()

						})



					}, function(error){


						//if we did not find something after all of that then try the title and author
						if (!foundSomething){


							if (activeRecord.title && activeRecord.author){
								var url = urlTitleAuthor.replace('{title}',encodeURIComponent(activeRecord.title)).replace('{author}',encodeURIComponent(activeRecord.author))
							}else{
								var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
							}

							if (debug) console.log(url)
							request({ encoding: "utf8",  uri: url}, function (error, response, body) {

								if (!error && response.statusCode == 200) {

									activeRecord.totalRequests++
									activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')


									//did we get a hit?
									if (body.search('<response code="2"')>-1) foundSomething = true

									results.push(body)
								}else{
									if (debug) console.log("Request ERROR:",response.statusCode,error)
								}

								//did we find nothing, try just the title
								if (activeRecord.author && foundSomething == false){

									var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
									request({ encoding: "utf8",  uri: url}, function (error, response, body) {
										
										activeRecord.totalRequests++
										activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')


										if (!error && response.statusCode == 200) {
											//did we get a hit?
											if (body.search('<response code="2"')>-1) foundSomething = true

											results.push(body)
										}else{
											if (debug) console.log("Request ERROR:",response.statusCode,error)
										}

										finished = true

									})



								}else{
									finished = true
								}

							})


						}else{

							finished = true

						}

					})




				})


			}else{

				//okay just do a title/author lookup

				if (activeRecord.title && activeRecord.author){
					var url = urlTitleAuthor.replace('{title}',encodeURIComponent(activeRecord.title)).replace('{author}',encodeURIComponent(activeRecord.author))
				}else{
					var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
				}

				if (debug) console.log(url)
				request({ encoding: "utf8",  uri: url}, function (error, response, body) {

					if (!error && response.statusCode == 200) {
						activeRecord.totalRequests++
						activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')


						//did we get a hit?
						if (body.search('<response code="2"')>-1) foundSomething = true

						results.push(body)
					}else{
						if (debug) console.log("Request ERROR:",response.statusCode,error)
					}

					//did we find nothing, try just the title
					if (activeRecord.author && foundSomething == false){

						var url = urlTitle.replace('{title}',encodeURIComponent(activeRecord.title) )
						request({ encoding: "utf8",  uri: url}, function (error, response, body) {

							if (!error && response.statusCode == 200) {

								activeRecord.totalRequests++
								activeRecord.totalBytes = activeRecord.totalBytes + Buffer.byteLength(body, 'utf8')


								//did we get a hit?
								if (body.search('<response code="2"')>-1) foundSomething = true

								results.push(body)
							}else{
								if (debug) console.log("Request ERROR:",response.statusCode,error)
							}

							finished = true

						})



					}else{
						finished = true
					}



				})



			}










			// setTimeout(function(){








			// 	process.send({ req: {results: activeRecord, id: cluster.worker.id} })


			// },1000)

		}

	}






	process.on('message', processRecord)


	///Infant-baptisme justified by a nevv discovery [electronic resource] : and also, several scripture allegories adjusted upon the like account. By William Parker clerk, incumbent of Wrotham in Kent.


	setInterval(function(){

		if (activeRecord){

			//if (debug) console.log(cluster.worker.id, "Asking for work")
			//if (debug) console.log(cluster.worker.id, "Working:",activeRecord.bnumber)
			//if (debug) console.log("finished:",finished,"resultsLength:",results.length)

			if (finished){

				var finalRecord = JSON.parse(JSON.stringify(activeRecord))



				activeRecord = false

				//we want to write our results out to the file system and get the next work

				finalRecord.foundSomething = foundSomething
				finalRecord.resultsLength = results.length
				finalRecord.results = results


				//write
				// var tmp = fs.createWriteStream(pathToCatalogClassifyResults + activeRecord.bnumber + '.json',{'flags': 'w'})
				// tmp.end(JSON.stringify(activeRecord))

				// tmp.on("finish",function(){

				// 	process.send({ req: {complete: activeRecord, id: cluster.worker.id} });
				// 	activeRecord = false
				// 	if (debug) console.log("WROTE")

				// })

				classifyDecode.returnData(finalRecord,function(decodeResults){


					//console.log("----------------------")
					//console.log(decodeResults)
					

					if (decodeResults.addOclcNumberOnly && (finalRecord.title != false && finalRecord.author != false) ){


						//we want to do it again with just the OCLC number this time to grab that full record since the title match doesn't have everything we need
						
						var msg = {}
						msg.req = {}

						msg.req.record 	= {
							_id: finalRecord._id,
							oclc : [decodeResults.data],
							isbn : [],
							issn : [],
							title : false,
							author : false
						}

						//process it again with this new record
						processRecord(msg)


					}else{


						process.send({ req: {results: decodeResults, record: finalRecord,  id: cluster.worker.id} });

					}



					

				});

				







			}


		}

	},Math.floor(Math.random() * (2000 - 500)))




























	//first request
	process.send({ req: {complete: activeRecord, id: cluster.worker.id} })



}	






// var work = function(cb){



// 	db.returnNextApiLccnWork(function(err,doc){

// 		if (err) console.log(err)


// 		if (doc) doc = doc[0]


// 		log.info(doc['_id']," Started working on.")



// 		setTimeout(function(){


// 			apiLccn.returnLccnMarcXml(doc['lccn'],function(xml){


// 				apiLccn.parseMarcXml(xml,function(results){

// 					log.info(doc['_id'],results)

// 					var updateRecord = {
// 						id: doc['_id']
// 					}


// 					if (results.dewey) updateRecord['lc:dcc'] = results.dewey
// 					if (results.lcc) updateRecord['lc:lcc'] = results.lcc
// 					if (results.oclc) updateRecord['lc:oclc'] = results.oclc

// 					count++
// 					if (updateRecord['lc:dcc']) addedDewey++
// 					if (updateRecord['lc:lcc']) addedLcc++
// 					if (updateRecord['lc:oclc']) addedOclc++



// 					db.updateBibRecord(updateRecord,function(err,r){

// 						//we want to delete this record from the work table so the next work call gets the next one in line to work
// 						db.deleteApiLccnWork(doc['_id'],function(err,results){
// 							if (err) log.info(doc['_id']," Error:",err)
// 							work()
// 						})


// 					})




// 				});




// 			})





// 		},5000)



// 	})




// }

// work()