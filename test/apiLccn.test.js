var should = require('should')
var api = require("../lib/apiLccn.js");



var xml = '<?xml version="1.0" encoding="UTF-8"?><record xmlns="http://www.loc.gov/MARC21/slim" xmlns:cinclude="http://apache.org/cocoon/include/1.0" xmlns:zs="http://www.loc.gov/zing/srw/">  <leader>01514cas a2200397   4500</leader>  <controlfield tag="001">11159577</controlfield>  <controlfield tag="005">20100417102533.0</controlfield>  <controlfield tag="007">t|</controlfield>  <controlfield tag="008">770914u19uuuuuuii gr    s   s0   a0eng  </controlfield>  <datafield tag="010" ind1=" " ind2=" ">    <subfield code="a">sa 67000968 </subfield>  </datafield>  <datafield tag="012" ind1=" " ind2=" ">    <subfield code="a">-3-7-1004164139-p-----    </subfield>  </datafield>  <datafield tag="022" ind1="0" ind2=" ">    <subfield code="a">0377-1881</subfield>    <subfield code="l">0377-1881</subfield>    <subfield code="2">0</subfield>  </datafield>  <datafield tag="025" ind1=" " ind2=" ">    <subfield code="a">PL480:I-E-6910s</subfield>  </datafield>  <datafield tag="035" ind1=" " ind2=" ">    <subfield code="a">(OCoLC)ocm03264170 </subfield>  </datafield>  <datafield tag="040" ind1=" " ind2=" ">    <subfield code="a">DLC</subfield>    <subfield code="c">DLC</subfield>    <subfield code="d">OCoLC</subfield>    <subfield code="d">NSDP</subfield>    <subfield code="d">DLC</subfield>    <subfield code="d">OCoLC</subfield>  </datafield>  <datafield tag="042" ind1=" " ind2=" ">    <subfield code="a">msc</subfield>    <subfield code="a">nsdp</subfield>  </datafield>  <datafield tag="043" ind1=" " ind2=" ">    <subfield code="a">a-ii---</subfield>  </datafield>  <datafield tag="050" ind1="0" ind2="0">    <subfield code="a">HB2730.M3</subfield>    <subfield code="b">M38a</subfield>  </datafield>  <datafield tag="082" ind1=" " ind2=" ">    <subfield code="a">331.1/1/095482</subfield>  </datafield>  <datafield tag="110" ind1="1" ind2=" ">    <subfield code="a">Madras (India : State).</subfield>    <subfield code="b">State Employment Market Information Unit.</subfield>  </datafield>  <datafield tag="222" ind1=" " ind2="0">    <subfield code="a">Occupational pattern of employees in the public sector in Madras State</subfield>  </datafield>  <datafield tag="245" ind1="1" ind2="0">    <subfield code="a">Occupational pattern of employees in the public sector in Madras State. (OCoLC)123456789</subfield>  </datafield>  <datafield tag="260" ind1=" " ind2=" ">    <subfield code="a">Madras,</subfield>    <subfield code="b">State Employment Market Information Unit, Govt. of Madras.</subfield>  </datafield>  <datafield tag="300" ind1=" " ind2=" ">    <subfield code="a">v.</subfield>    <subfield code="c">30 cm.</subfield>  </datafield>  <datafield tag="310" ind1=" " ind2=" ">    <subfield code="a">Biennial</subfield>  </datafield>  <datafield tag="500" ind1=" " ind2=" ">    <subfield code="a">At head of title, 1962-   : National Employment Service.</subfield>  </datafield>  <datafield tag="590" ind1=" " ind2=" ">    <subfield code="a">SERBIB/SERLOC merged record</subfield>  </datafield>  <datafield tag="650" ind1=" " ind2="0">    <subfield code="a">Occupations</subfield>    <subfield code="z">India</subfield>    <subfield code="z">Tamil Nadu.</subfield>  </datafield>  <datafield tag="650" ind1=" " ind2="0">    <subfield code="a">Government business enterprises</subfield>    <subfield code="z">India</subfield>    <subfield code="z">Tamil Nadu.</subfield>  </datafield>  <datafield tag="710" ind1="1" ind2=" ">    <subfield code="a">India.</subfield>    <subfield code="b">National Employment Service.</subfield>  </datafield>  <datafield tag="890" ind1=" " ind2=" ">    <subfield code="a">Madras (State). State Employment Market Information Unit.  Occupational pattern of employees in the public sector in Madras State.  Madras.</subfield>    <subfield code="i">sa67-968</subfield>  </datafield>  <datafield tag="906" ind1=" " ind2=" ">    <subfield code="a">7</subfield>    <subfield code="b">cbc</subfield>    <subfield code="c">serials</subfield>    <subfield code="d">4</subfield>    <subfield code="e">ncip</subfield>    <subfield code="f">19</subfield>    <subfield code="g">n-oclcserc</subfield>  </datafield>  <datafield tag="920" ind1=" " ind2=" ">    <subfield code="a">Keep 1</subfield>  </datafield>  <datafield tag="936" ind1=" " ind2=" ">    <subfield code="a">1964</subfield>  </datafield>  <datafield tag="991" ind1=" " ind2=" ">    <subfield code="b">c-GenColl</subfield>    <subfield code="h">HB2730.M3</subfield>    <subfield code="i">M38a</subfield>    <subfield code="w">SERIALS</subfield>  </datafield>  <datafield tag="992" ind1=" " ind2=" ">    <subfield code="b">B/L</subfield>    <subfield code="w">SERLOC</subfield>  </datafield></record>';
var xml2 = '<?xml version="1.0" encoding="UTF-8"?><record xmlns="http://www.loc.gov/MARC21/slim" xmlns:cinclude="http://apache.org/cocoon/include/1.0" xmlns:zs="http://www.loc.gov/zing/srw/">  <leader>01638cas a2200385 a 4500</leader>  <controlfield tag="001">11465105</controlfield>  <controlfield tag="005">20130120163607.0</controlfield>  <controlfield tag="008">951211d19931996fj ar        i0    0eng c</controlfield>  <datafield tag="010" ind1=" " ind2=" ">    <subfield code="a">   96640083 </subfield>    <subfield code="z">sn 95044640 </subfield>  </datafield>  <datafield tag="012" ind1=" " ind2=" ">    <subfield code="a">-3-7-1301191948-p-----    </subfield>  </datafield>  <datafield tag="035" ind1=" " ind2=" ">    <subfield code="a">(OCoLC)ocm33886592 </subfield>  </datafield>  <datafield tag="040" ind1=" " ind2=" ">    <subfield code="a">NN</subfield>    <subfield code="b">eng</subfield>    <subfield code="c">NN</subfield>    <subfield code="d">DLC</subfield>    <subfield code="d">MH</subfield>    <subfield code="d">DLC</subfield>    <subfield code="d">MH-L</subfield>    <subfield code="d">OCoLC</subfield>  </datafield>  <datafield tag="042" ind1=" " ind2=" ">    <subfield code="a">pcc</subfield>  </datafield>  <datafield tag="043" ind1=" " ind2=" ">    <subfield code="a">e------</subfield>    <subfield code="a">pows---</subfield>  </datafield>  <datafield tag="050" ind1="0" ind2="0">    <subfield code="a">HC687.5.A1</subfield>    <subfield code="b">C6</subfield>  </datafield>  <datafield tag="082" ind1="0" ind2="0">    <subfield code="a">337.409614/05</subfield>    <subfield code="2">20</subfield>  </datafield>  <datafield tag="245" ind1="0" ind2="0">    <subfield code="a">Cooperation between the European Union and Western Samoa covering the period ... /</subfield>    <subfield code="c">Delegation of the European Commission for the Pacific.</subfield>  </datafield>  <datafield tag="246" ind1="1" ind2="4">    <subfield code="a">Co-operation between the European Union and Western Samoa, annual report</subfield>  </datafield>  <datafield tag="260" ind1=" " ind2=" ">    <subfield code="a">Suva :</subfield>    <subfield code="b">The Delegation,</subfield>    <subfield code="c">1994-1996.</subfield>  </datafield>  <datafield tag="300" ind1=" " ind2=" ">    <subfield code="a">v. ;</subfield>    <subfield code="c">28 cm.</subfield>  </datafield>  <datafield tag="310" ind1=" " ind2=" ">    <subfield code="a">Annual</subfield>  </datafield>  <datafield tag="362" ind1="0" ind2=" ">    <subfield code="a">1993-1996.</subfield>  </datafield>  <datafield tag="590" ind1=" " ind2=" ">    <subfield code="a">SERBIB/SERLOC merged record</subfield>  </datafield>  <datafield tag="650" ind1=" " ind2="0">    <subfield code="a">Economic assistance</subfield>    <subfield code="z">Samoa</subfield>    <subfield code="v">Periodicals.</subfield>  </datafield>  <datafield tag="610" ind1="2" ind2="0">    <subfield code="a">European Union</subfield>    <subfield code="z">Samoa</subfield>    <subfield code="v">Periodicals.</subfield>  </datafield>  <datafield tag="650" ind1=" " ind2="0">    <subfield code="a">Economic development projects</subfield>    <subfield code="z">Samoa</subfield>    <subfield code="x">Finance</subfield>    <subfield code="v">Periodicals.</subfield>  </datafield>  <datafield tag="710" ind1="2" ind2=" ">    <subfield code="a">European Commission.</subfield>    <subfield code="b">Delegation for the Pacific.</subfield>  </datafield>  <datafield tag="780" ind1="0" ind2="0">    <subfield code="t">Co-operation between the European Community and Western Samoa, annual report covering the period ...</subfield>    <subfield code="w">(DLC)   89643629</subfield>    <subfield code="w">(OCoLC)19550312</subfield>  </datafield>  <datafield tag="785" ind1="0" ind2="0">    <subfield code="t">Co-operation between the European Union and Samoa</subfield>    <subfield code="w">(DLC)   00235357</subfield>    <subfield code="w">(OCoLC)43762319</subfield>  </datafield>  <datafield tag="850" ind1=" " ind2=" ">    <subfield code="a">DLC</subfield>    <subfield code="a">NN</subfield>  </datafield>  <datafield tag="890" ind1=" " ind2=" ">    <subfield code="a">Cooperation between the European Union and Western Samoa covering the period ...</subfield>    <subfield code="i">96-640083</subfield>  </datafield>  <datafield tag="906" ind1=" " ind2=" ">    <subfield code="a">7</subfield>    <subfield code="b">cbc</subfield>    <subfield code="c">serials</subfield>    <subfield code="d">u</subfield>    <subfield code="e">ncip</subfield>    <subfield code="f">19</subfield>    <subfield code="g">n-oclcserc</subfield>  </datafield>  <datafield tag="920" ind1=" " ind2=" ">    <subfield code="a">Keep 1</subfield>  </datafield>  <datafield tag="991" ind1=" " ind2=" ">    <subfield code="b">c-GenColl</subfield>    <subfield code="h">HC687.5.A1</subfield>    <subfield code="i">C6</subfield>    <subfield code="w">SERIALS</subfield>  </datafield>  <datafield tag="992" ind1=" " ind2=" ">    <subfield code="b">B/L</subfield>    <subfield code="w">SERLOC</subfield>  </datafield></record>'



describe('API Lccn', function () {

	this.timeout(30000);



	it('parseMarcXml - it should parse xml and return the fields we need', function (done) {
	


		api.parseMarcXml(xml,function(results){
			results.dewey.should.equal(331.1)
			results.oclc[0].should.equal(3264170)
			results.lcc.should.equal('HB2730.M3')
			done()
		})
	})

	it('parseMarcXml - again - it should parse xml and return the fields we need', function (done) {
	
		api.parseMarcXml(xml2,function(results){
			results.dewey.should.equal(337.409614)
			results.oclc[0].should.equal(33886592)
			results.oclc[1].should.equal(19550312)
			results.oclc[2].should.equal(43762319)
			results.lcc.should.equal('HC687.5.A1')
			done()
		})
	})



	it('parseMarcXml - bad - it should parse xml and return the fields we need', function (done) {
	


		api.parseMarcXml("",function(results){

			should.not.exist(results.dewey)
			should.not.exist(results.oclc)
			should.not.exist(results.lcc)

			done()
		})
	})



	// it('returnLccnMarcXml - it should return string of request', function (done) {
	


	// 	api.returnLccnMarcXml('sa67003575',function(results){

	// 		results.length.should.be.above(1000)
	// 		done()
	// 	})
	// })


	// it('returnLccnMarcXml - it should return string of request with bad lccn', function (done) {
	
	// 	api.returnLccnMarcXml('fsdgsdfgsdfg',function(results){

	// 		results.should.equal('')
	// 		done()
	// 	})
	// })



})