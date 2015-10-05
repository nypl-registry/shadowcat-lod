var async = require('async')
require("string_score")
var N3 = require('n3')
var N3Util = N3.Util

var parser = N3.Parser();

var exports = module.exports = {};



//the various logic if we should use data from a classify result or not
exports.returnData = function(oclc,turtle,cb){


	var aboutFast = [], aboutLcsh = [], aboutViaf = []
	var contributor = []
	var creator = []
	var datePublished = []
	var genre = []

	var labelLookup = {}


	parser.parse(turtle, 

		function (error, triple, prefixes) {
			if (triple){
				if (triple.predicate == 'http://schema.org/name') labelLookup[triple.subject] = N3Util.getLiteralValue(triple.object)

				if (triple.subject == 'http://www.worldcat.org/oclc/'+oclc)	{


					//load in the about possiblities, except the oclc experiment nonsense
					if (triple.predicate == 'http://schema.org/about'){
						if (triple.object.search('viaf.org') > -1 ) aboutViaf.push(triple.object)
						if (triple.object.search('id.worldcat.org/fast') > -1 ) aboutFast.push(triple.object)
						if (triple.object.search('id.loc.gov/authorities/subjects') > -1 ) aboutLcsh.push(triple.object)
					}

					if (triple.predicate == 'http://schema.org/creator'){
						if (triple.object.search('viaf.org') > -1 ) creator.push(triple.object)
					}

					if (triple.predicate == 'http://schema.org/contributor'){
						if (triple.object.search('viaf.org') > -1 ) contributor.push(triple.object)
					}

					if (triple.predicate == 'http://schema.org/genre'){
						genre.push(N3Util.getLiteralValue(triple.object))
					}

					if (triple.predicate == 'http://schema.org/datePublished'){
						datePublished.push( N3Util.getLiteralValue(triple.object) )
					}

				}




			}else{

				cb(error, {
					aboutFast : aboutFast,
					aboutLcsh : aboutLcsh,
					aboutViaf : aboutViaf,
					contributor : contributor,
					creator : creator,
					datePublished : datePublished,
					genre : genre,
					labelLookup: labelLookup
				})


			}
		}
	)


}