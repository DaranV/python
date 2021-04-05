const express = require('express');
const helmet = require('helmet');
const path = require('path');
const mysql = require('mysql');
const config = require('./config');
const _ = require('lodash');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const search = require("../landmark/search");
const fingerprint = require("../landmark/fingerprint");

const app = express()
app.use(helmet());
app.disable('x-powered-by');
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var pool = mysql.createPool(_.merge(config.mysql, {
	connectionLimit : 10
}));
var processes = [];
/*
connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        process.exit(1);
        return;
    }
	
    console.log("Successfully connected to mysql");
});*/

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/media', express.static(__dirname + '/tmp/'));
app.use('/js', express.static(__dirname + '/views/js/'));
app.use('/css', express.static(__dirname + '/views/css/'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.get('/stats/:id', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/stats.html'));
});

app.get('/api/process/:id', function (req, res) {
    if (req.params.id == undefined) {
        return res.status(404).json({
            error: true,
            msg: "Invalid Request",
        });
    } else {
        var tmp = _.find(processes, function (o) { return o.song_id == req.params.id; })
        if (tmp == undefined) {
            return res.status(404).json({
                error: true,
                msg: "Invalid Song Id"
            });
        } else {
            return res.json({
                error: false,
                msg: tmp
            });
        }
    }
});

app.post('/api/generate', function (req, res) {
    if (req.body.tmp_id == undefined || req.body.title == undefined || req.body.artist == undefined) {
        return res.status(404).json({
            error: true,
            msg: "Invalid Request"
        });
    } else {
        try {
            if (fs.existsSync(path.join(__dirname + '/tmp/' + req.body.tmp_id + '.mp3'))) {
                var sql = 'SELECT count(*) as count FROM songs WHERE song_title = "' + req.body.title + '" AND song_artist = "' + req.body.artist + '"';
				
				
				pool.getConnection(function(err, connection) {
					if (err) throw err; // not connected!

					connection.query(sql, function (err, results) {
						if (err) throw err;
						connection.release();

						if (results[0].count == 0) {
							var song = {
								song_title: req.body.title,
								song_artist: req.body.artist,
								song_file_id: req.body.tmp_id,
								added_at: new Date().toLocaleDateString()
							};
							
							pool.getConnection(function(err, connection) {
							  if (err) throw err; // not connected!
							  var query = connection.query('INSERT INTO songs SET ?', song, function (error, results, fields) {
								if (error) throw error;
								connection.release();
						
								var tmp = req.body;
								tmp.song_id = results.insertId;
								tmp.state = 0;
								processes.push(tmp);

								(async () => {
									setTimeout(async () => {
										var tmp = _.find(processes, function (o) { return o.song_id == results.insertId; })
										tmp.state = 1;
										tmp.nb = 0;
										tmp.mysql = 0;
		
										fingerprint(path.join(__dirname + '/tmp/' + req.body.tmp_id + '.mp3'), (data) => {
											tmp.nb += data.tcodes.length;
											var sql = "INSERT INTO fingerprints (song_id, offset, hash) VALUES ?";
											var values = [];
											for (var i = 0; i < data.tcodes.length; i++) {
												values[i] = [results.insertId, data.tcodes[i], new Buffer(data.hcodes[i], 'hex')];
											}
											
											pool.getConnection(function(err, connection) {
												if (err) throw err; // not connected!
												connection.query(sql, [values], function(err, results) {
													if (err) throw err;
													connection.release();
													tmp.state = 3;
													tmp.mysql += results.affectedRows;
													if(tmp.mysql == tmp.nb){
														tmp.state = 4;
													}
												});
											});
										});
									}, 500);
								})();

								return res.json({
									error: false,
									msg: 'Starting',
									data: req.body,
									song_id: results.insertId,
								});
							});
							});
						} else {
							return res.json({
								error: true,
								msg: 'Une musique portant ce nom et prevenant de cet artiste existe déjà.',
								data: req.body
							});
						}
					});
				});
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                msg: "Internal Server Error"
            });
        }
    }
});

app.post('/api/upload', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            error: true,
            msg: 'No files were uploaded.'
        });
    }

    var sampleFile = req.files.sampleFile;
    var id = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);

    sampleFile.mv(path.join(__dirname + '/tmp/' + id + '.mp3'), function (err) {
        if (err)
            return res.status(500).json({
                error: true,
                msg: err
            });

        res.json({
            error: false,
            msg: 'File Uploaded',
            id: id
        });
    });
});

function get_song(el, cb){
	var sql = "SELECT * FROM songs WHERE song_id = " + el.key + ";";
	
	pool.getConnection(function(err, connection) {
		if (err) throw err; // not connected!
		connection.release();
	
		connection.query(sql, function (err, results) {
			if (err) throw err;
			cb({
				key: el, 
				data: results
			});
		});
	});
}

app.post('/api/search', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            error: true,
            msg: 'No files were uploaded.'
        });
    }
	
	console.log("Starting search");

    var sampleFile = req.files.sampleFile;
    var id = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);
	id = "search-" + id;

    sampleFile.mv(path.join(__dirname + '/tmp/' + id + '.mp3'), function (err) {
        if (err)
            return res.status(500).json({
                error: true,
                msg: err
            });

		var start = Date.now();
		
		var sql = "SELECT songs.song_id, songs.song_title, songs.song_artist, songs.song_file_id, songs.added_at, songs.song_id, (SELECT COUNT(HASH) FROM fingerprints WHERE song_id = songs.song_id) AS nbFinger FROM songs;";

		pool.getConnection(function(err, connection) {
			if (err) throw err; // not connected!

			connection.query(sql, function (err, rresults) {
				if (err) throw err;
				connection.release();

				if (rresults.length == 0) {
					res.json({
						error: true,
						msg: 'Aucune correspondance dans notre base de donnée',
					});
				} else {
					search(path.join(__dirname + '/tmp/' + id + '.mp3'), (results) => {
						var end = Date.now();
						try {
						  fs.unlinkSync(path.join(__dirname + '/tmp/' + id + '.mp3'))
						} catch(err) {
						  console.error(err)
						}
						
						console.log({
							error: false,
							msg: 'File Uploaded',
							id: id,
							results: _.map(_.orderBy(Object.keys(results.matches).map(key => ({ key, value: results.matches[key] })), 'value', 'desc'), (el) => {
								return _.merge(_.find(rresults, function(o) { return o.song_id == el.key; }), el);
							}),
							time: (end - start),
							count: results.total
						});
						
						res.json({
							error: false,
							msg: 'File Uploaded',
							id: id,
							results: _.map(_.orderBy(Object.keys(results.matches).map(key => ({ key, value: results.matches[key] })), 'value', 'desc'), (el) => {
								return _.merge(_.find(rresults, function(o) { return o.song_id == el.key; }), el);
							}),
							time: (end - start),
							count: results.total
						});
					})
				}
			});
		});


		
    });
});

app.get('/api/list-songs', function (req, res) {
    var sql = "SELECT songs.song_id, songs.song_title, songs.song_artist, songs.song_file_id, songs.added_at, songs.song_id, (SELECT COUNT(HASH) FROM fingerprints WHERE song_id = songs.song_id) AS nbFinger FROM songs;";

	pool.getConnection(function(err, connection) {
		if (err) throw err; // not connected!

		connection.query(sql, function (err, results) {
			if (err) throw err;
			connection.release();


			if (results.length == 0) {
				res.json({
					data: [],
					size: 0
				});
			} else {
				res.json({
					data: _.map(results, (el) => {
						return {
							id: el.song_id,
							title: el.song_title,
							artist: el.song_artist,
							nb_fingerprint: el.nbFinger,
							file_id: el.song_file_id,
							added_at: el.added_at
						}
					}),
					size: results.length
				});
			}
		});
	});
});

module.exports.start = (port, cb) => {
    app.listen(port, function () {
        cb();
    });
}