const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const constants = require('./constants');

function convert(file, cb){
    var bufs = [];

    var command = ffmpeg(file)
        .toFormat(constants.FFMPEG.FORMAT)
        .audioCodec(constants.FFMPEG.CODEC)
        .audioFrequency(constants.FREQ_ECHANTILLON)
        .audioChannels(constants.FFMPEG.NB_CHANNEL)
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', () => {
            cb(bufs);
        });

    var stream = command.pipe();
    stream.on('data', function(chunk) {
        bufs.push(chunk);
    });
}

module.exports = convert;