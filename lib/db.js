//this module works with the datastore to do things~

var MongoClient = require('mongodb').MongoClient
var config = require("config")
var Db = require('mongodb').Db
var Server = require('mongodb').Server
var async = require("async")

var exports = module.exports = {}

var mongoConnectURL = config['DB']['mongoConnectURL']
var mongoIp = config['DB']['mongoIp']
var mongoPort = config['DB']['mongoPort']
var mongoDb = config['DB']['mongoDb']


exports.testOverride = false


exports.createBaseMetadata = function(datetime,cb){

	//delete the existing metadata
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.remove({ name : "metadata" }, function(err, result) {
			var baseData = {

				name : "metadata",
				bibLastUpdatedDate : datetime,
				bibLastUpdatedOffset: 0,
				itemLastUpdatedDate : datetime,
				itemLastUpdatedOffset : 0

			}

			collection.insert(baseData, function(err, result) {

				db.close()

				if (cb) cb(result)

			})
		});

	});	


}


exports.getMetadata = function(cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.find({name : "metadata"}).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		})
	})

}



exports.returnBibCollection = function(cb){

	var db = new Db(mongoDb, new Server(mongoIp, mongoPort));

	db.open(function(err, db) {

		var collection = db.collection('bib')

		cb(err, collection, db)



	})



}





exports.updateBibMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { bibLastUpdatedDate : date, bibLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(err,result);
		})

	})

}
exports.updateItemMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { itemLastUpdatedDate : date, itemLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(err,result);
		})
	})
}



exports.updateBibRecord = function(bib,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.update({ _id : bib.id }
			, { $set: bib }, function(err, result) {
			db.close()
			if (cb) cb(err,result);
		})

	})

}


exports.insertBibRecord = function(bib,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.insert(bib, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}











exports.updateItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.update({ _id : item.id }
			, { $set: item }, function(err, result) {
			db.close()
			if (cb) cb(err,result);
		})

	})

}


exports.insertItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}




exports.returnBibById = function(id,cb,db){


	//if a db is already active 
	if (db){

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		collection.find({_id : id}).toArray(function(err, docs) {
			cb(err,docs)
		});

	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
			collection.find({_id : id}).toArray(function(err, docs) {
				db.close()
				cb(err,docs)
			});
		});	

	}

}

exports.returnItemByBibIds = function(id,cb,db){


	//if a db is already active 
	if (db){

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
		collection.find({bibIds : id}).toArray(function(err, docs) {
			cb(err,docs)
		});

	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
			collection.find({bibIds : id}).toArray(function(err, docs) {
				db.close()
				cb(err,docs)
			})
		})

	}




}




exports.allBibs = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


		var cursor = collection.find({})
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			db.close();
		});




	})


}


exports.allItems = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')


		var cursor = collection.find({}).sort({ $natural: -1 });
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			db.close();
		});




	})


}




exports.dropTestCollection = function(cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('test')
		collection.drop(function(err, reply) {
			if (cb) cb(reply)
		})
	})
}



exports.returnNextApiHoldingsWork = function(cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiHoldings')
		collection.find().limit(1).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		})
	})	



}

exports.deleteApiHoldingsWork = function(id,cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiHoldings')
		collection.remove({_id : id}, function(err, results){

			if (err) console.log(err)

			db.close()
			cb(err,results)


		})


	})



}

exports.returnNextApiLccnWork = function(cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		if (err) console.log(err)
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiLccn')
		collection.find().limit(1).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		})
	})	



}

exports.deleteApiLccnWork = function(id,cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiLccn')
		collection.remove({_id : id}, function(err, results){

			if (err) console.log(err)

			db.close()
			cb(err,results)


		})


	})



}



exports.returnNextApiClassifyWork = function(cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		if (err) console.log(err)
		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiClassify')
		collection.find().limit(1000).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		})
	})	



}



exports.updateClassifyData = function(dataStore,updateStartTime,cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {

		var collectionBib = (exports.testOverride) ? db.collection('test') : db.collection('bib')
		var collectionClassify = (exports.testOverride) ? db.collection('test') : db.collection('apiClassify')


		async.eachSeries(dataStore, function(data, callback){

			if (data){

				if (data.complete && data.update && data.completeTime < updateStartTime){

					collectionBib.update({ _id : data.update.id }, { $set: data.update }, function(err, result) {
						

						if (err) console.log("ERR",err)

						collectionClassify.remove({_id : data.update.id}, function(err, results){

							if (err) console.log(err)

							callback()


						})




					})


				}else{
					callback()
				}

			}else{
				callback()
			}


		}, function(error){

			if (cb) cb(error,true)
			db.close()

		})



	})



}


exports.updateBotReport = function(bots,cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {

		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bots')

		async.eachSeries(bots, function(bot, callback){

			bot._id = bot.name


			collection.insert(bot, function(err, result) {		

				if (err){

					collection.update({ _id : bot._id }, { $set: bot }, function(err, result) {

						if(err) console.log(err)

						callback()						

					})					


				}else{

					callback()

				}


			})	


		}, function(error){

			if (error) console.log(error)

			db.close()


		})

	})






}













