const mysql = require('mysql');
const config = require('../web/config');
const _ = require('lodash');
const fs = require('fs');
const fingerprint = require("./fingerprint");

var pool = mysql.createPool(_.merge(config.mysql, {
	connectionLimit : 10
}));


function align_matches(matches){
	var diff_counter = {};
	var largest = 0;
	var largest_count = 0;
    var song_id = -1;
	
	for(var i = 0; i < matches.length; i++){
		var tup = matches[i];
		var sid = tup.id;
		var diff = tup.diff;
		
		if (!diff_counter[diff]) diff_counter[diff] = {};
		if (!diff_counter[diff][sid]) diff_counter[diff][sid] = 0;
        diff_counter[diff][sid] += 1;

		if (diff_counter[diff][sid] > largest_count){
			largest = diff;
			largest_count = diff_counter[diff][sid];
			song_id = sid;
		}
	}
	
	return {
		id: song_id,
		count: largest_count,
		diff: largest
	};
}

function search(file, cb){
	var processes = {
		matches: {},
		d: Date.now(),
		s: false,
		total: 0,
	};
	
	fingerprint(file, (data) => {
		var values = [];
		processes.s = true;
		processes.d = Date.now();
		processes.total += data.tcodes.length;
		
		var inStr = "(", fingerVector = [];
		
		for (var i=0; i<data.tcodes.length; i++) {
			inStr += (i == 0) ? "?" : ",?";
			fingerVector.push(new Buffer(data.hcodes[i], 'hex'));
		}
		inStr += ")";
		
		let self = this;
		
		pool.getConnection(function(err, connection) {
		  if (err) throw err; // not connected!

		  var query = connection.query("SELECT * FROM songs s, fingerprints f WHERE f.song_id = s.song_id AND hash IN " + inStr + ";", fingerVector, function (error, results, fields) {
			if (error) throw error;
			
			connection.release();
			if(results.length != 0){
				var mapper = {};
				
				for (var i = 0; i < data.tcodes.length; i++){
					var hash = data.hcodes[i];
					var offset = data.tcodes[i];
					mapper[hash] = offset;
				}
				
				var values = _.keys(mapper);
				var matches = [];
				
				for(var i = 0; i < results.length; i++){
					matches.push({
						id: results[i].song_id,
						diff: results[i].offset - mapper[new Buffer(results[i].hash, 'binary' ).toString("hex")],
					});
				}
				
				var {id, count, diff} = align_matches(matches);
				
				if(!processes.matches[id]) processes.matches[id] = count;
				else processes.matches[id] += count;
				
				processes.d = Date.now();
			}
		});
		});
		
		
		
	});
	
	var interval = setInterval(() => {
		if(processes.s){
			if((Date.now() - processes.d) > 200 ){
				cb(processes);
				clearInterval(interval);
			}
		}
	}, 100);
}

module.exports = search;