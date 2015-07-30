
var byline = require('byline')
var fs = require("fs")


var exports = module.exports = {};



exports.streamFile = function(filename,cb){



	var stream = fs.createReadStream(filename, { encoding: 'utf8' });
	stream = byline.createStream(stream);


	stream.on('data', function(line) {


		stream.pause()

		cb(JSON.parse(line),stream)

	})



}