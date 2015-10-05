var worldcatDecode = require("../lib/worldcatDecode.js")
var should = require('should')
var fs = require("fs")


//test data
var ttl236088809 = fs.readFileSync(__dirname + '/data/236088809.ttl', "utf8")
var ttl60311754 = fs.readFileSync(__dirname + '/data/60311754.ttl', "utf8")
var ttl411620 = fs.readFileSync(__dirname + '/data/411620.ttl', "utf8")
var ttlmalformed = fs.readFileSync(__dirname + '/data/malformed.ttl', "utf8")






describe('Worldcat Decode', function () {



	it('ttl60311754',function(done){


		worldcatDecode.returnData(60311754,ttl60311754,function(err,results){


			results.aboutFast.length.should.equal(7)
			results.contributor.length.should.equal(0)

			results.aboutLcsh[0].should.equal('http://id.loc.gov/authorities/subjects/sh2010102201')
			results.aboutViaf[0].should.equal('http://viaf.org/viaf/2478331')
			results.creator[0].should.equal('http://viaf.org/viaf/49518824')

			results.datePublished[0].should.equal('2006')
			results.genre[0].should.equal('History')

			

			done()

		})



	})
	it('ttl411620',function(done){


		worldcatDecode.returnData(411620,ttl411620,function(err,results){


			results.contributor[0].should.equal('http://viaf.org/viaf/5009565')
			results.genre[0].should.equal('Biography')

			

			done()
		})



	})

	it('malformed',function(done){


		worldcatDecode.returnData(411620,ttlmalformed,function(err,results){
			
			err.toString().search("Syntax error").should.be.above(-1)					

			done()
		})



	})
})
