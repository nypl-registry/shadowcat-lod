var config = require("config")
var request = require('request');
var fs = require('fs')
var parseString = require('xml2js').parseString;

var exports = module.exports = {}



exports.parseMarcXml = function(xml, cb){


	if (!xml){
		cb({})
		return false
	}	

	if (xml === ''){
		cb({})
		return false
	}
	parseString(xml, function (err, results) {

		var dewey = null, oclc = null, lcc = null


		if (results.record){

			for (var x in results.record.datafield){

				var datafield = results.record.datafield[x];


				if (datafield['$'].tag === '082'){
					
					if (datafield.subfield[0]){

						if (datafield.subfield[0]['_']){
							var d = parseFloat(datafield.subfield[0]['_'])

							if (!isNaN(d)) dewey = d;

						}
					}
				}


				if (datafield['$'].tag === '050'){
					
					if (datafield.subfield){

						for (var x in datafield.subfield){

							var subfield = datafield.subfield[x]

							if (subfield['_']){
								if (subfield['$']){
									if (subfield['$'].code){
										if (subfield['$'].code === 'a'){
											var lcc = subfield['_']
										}
									}
								}						
							}
						}
					}
				}	


			}

		}



		var oclcs = xml.match(/\(ocolc\)[a-z]*[0-9]{4}[0-9]+/ig);

		if (oclcs){

			oclc = []

			for (var x in oclcs){

				if (oclcs[x].match(/[0-9]{4}[0-9]+/)){

					var o = oclcs[x].match(/[0-9]{4}[0-9]+/);

					if (!isNaN(o[0])){
						oclc.push(parseInt(o[0]))
					}
				}

			}
			
		}


		var update = {}

		if (lcc) update.lcc = lcc
		if (dewey) update.dewey = dewey
		if (oclc){
			if (oclc.length>0) update.oclc = oclc
		}

	    cb(update)


	})

}


exports.returnLccnMarcXml = function(lccn,cb){


	var url = 'http://lccn.loc.gov/{lccn}/marcxml'

	url = url.replace('{lccn}',lccn)

	request.get({ url : url, headers: {
    	
    	'Accept'    : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    	'User-Agent': 'request'
  	}},

	function (error, response, body) {


		if (error) console.log(error);


		var results = (body) ? body : ""
		if (results.search('Invalid LCCN')>-1 && results.search('<error>')>-1 ) results = ''



		cb(results)


    
    })

}




