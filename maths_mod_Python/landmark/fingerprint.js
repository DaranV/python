const dsp = require('dsp.js');
const convert = require('./convert');
const constants = require('./constants');
const sha1 = require('sha1');

module.exports = (file, cb) => {
    convert(file, (b) => {
        var FFT = new dsp.FFT(constants.TAILLE_SPECTRE, constants.FREQ_ECHANTILLON);
        var buffer = new Buffer(0);
        var bufferDelta = 0;

        var stepIndex = 0;
        var marks = [];

        var threshold = new Array(constants.STEP);
        for (var i = 0; i < constants.STEP; i++) {
            threshold[i] = -3;
        }

        for (var i = 0; i < b.length; i++) {
            var chunk = b[i];

            let tcodes = [];
            let hcodes = [];

            buffer = Buffer.concat([buffer, chunk]);

            while ((stepIndex + constants.TAILLE_SPECTRE) * constants.OCTET_PAR_ECHANTILLON < buffer.length + bufferDelta) {
                let data = new Array(constants.TAILLE_SPECTRE);

                for (let i = 0, limit = constants.TAILLE_SPECTRE; i < limit; i++) {
                    data[i] = constants.FENETRE_HANNING[i] * buffer.readInt16LE((stepIndex + i) * constants.OCTET_PAR_ECHANTILLON - bufferDelta) / Math.pow(2, 8 * constants.OCTET_PAR_ECHANTILLON - 1);
                }

                stepIndex += constants.STEP;

                FFT.forward(data); 

                for (let i = constants.IF_MIN; i < constants.IF_MAX; i++) {
                    FFT.spectrum[i] = Math.abs(FFT.spectrum[i]) * Math.sqrt(i + 16);
                }

                let diff = new Array(constants.STEP);
                for (let i = constants.IF_MIN; i < constants.IF_MAX; i++) {
                    diff[i] = Math.max(Math.log(Math.max(1e-6, FFT.spectrum[i])) - threshold[i], 0);
                }

                let iLocMax = new Array(constants.NOMBRE_MAX_PEAKS);
                let vLocMax = new Array(constants.NOMBRE_MAX_PEAKS);

                for (let i = 0; i < constants.NOMBRE_MAX_PEAKS; i++) {
                    iLocMax[i] = NaN;
                    vLocMax[i] = Number.NEGATIVE_INFINITY;
                }

                for (let i = constants.IF_MIN + 1; i < constants.IF_MAX - 1; i++) {
                    if (diff[i] > diff[i - 1] && diff[i] > diff[i + 1] && FFT.spectrum[i] > vLocMax[constants.NOMBRE_MAX_PEAKS - 1]) { 
                        for (let j = constants.NOMBRE_MAX_PEAKS - 1; j >= 0; j--) {
                            if (j >= 1 && FFT.spectrum[i] > vLocMax[j - 1]) continue;
                            for (let k = constants.NOMBRE_MAX_PEAKS - 1; k >= j + 1; k--) {
                                iLocMax[k] = iLocMax[k - 1];
                                vLocMax[k] = vLocMax[k - 1];
                            }
                            iLocMax[j] = i;
                            vLocMax[j] = FFT.spectrum[i];
                            break;
                        }
                    }
                }

                for (let i = 0; i < constants.NOMBRE_MAX_PEAKS; i++) {
                    if (vLocMax[i] > Number.NEGATIVE_INFINITY) {
                        for (let j = constants.IF_MIN; j < constants.IF_MAX; j++) {
                            threshold[j] = Math.max(threshold[j], Math.log(FFT.spectrum[iLocMax[i]]) + constants.GAUSSIAN_MASK[iLocMax[i]][j]);
                        }
                    } else {
                        vLocMax.splice(i, constants.NOMBRE_MAX_PEAKS - i);
                        iLocMax.splice(i, constants.NOMBRE_MAX_PEAKS - i);
                        break;
                    }
                }

                marks.push({ "t": Math.round(stepIndex / constants.STEP), "i": iLocMax, "v": vLocMax });

                let nm = marks.length;
                let t0 = nm - constants.PRUNING_DT - 1;

                for (let i = nm - 1; i >= Math.max(t0 + 1, 0); i--) {
                    for (let j = 0; j < marks[i].v.length; j++) {
                        if (marks[i].i[j] != 0 && Math.log(marks[i].v[j]) < threshold[marks[i].i[j]] + constants.MASK_DECAY_LOG * (nm - 1 - i)) {
                            marks[i].v[j] = Number.NEGATIVE_INFINITY;
                            marks[i].i[j] = Number.NEGATIVE_INFINITY;
                        }
                    }
                }

                let nFingersTotal = 0;
                if (t0 >= 0) {
                    let m = marks[t0];

                    loopCurrentPeaks:
                    for (let i = 0; i < m.i.length; i++) {
                        let nFingers = 0;

                        for (let j = t0; j >= Math.max(0, t0 - constants.WINDOW_DT); j--) {

                            let m2 = marks[j];

                            for (let k = 0; k < m2.i.length; k++) {
                                if (m2.i[k] != m.i[i] && Math.abs(m2.i[k] - m.i[i]) < constants.WINDOW_DF) {
                                    tcodes.push(m.t);
                                    //hcodes.push(m2.i[k] + constants.TAILLE_SPECTRE / 2 * (m.i[i] + constants.TAILLE_SPECTRE / 2 * (t0 - j)));
                                    hcodes.push(sha1(m.i[i] + "|" + m2.i[k] + "|" + (t0 - j)).substring(0, 20));
                                    nFingers += 1;
                                    nFingersTotal += 1;
                                    if (nFingers >= constants.NOMBRE_PAIRS_PEAKS) continue loopCurrentPeaks;
                                }
                            }
                        }
                    }
                }

                for (let j = 0; j < threshold.length; j++) {
                    threshold[j] += constants.MASK_DECAY_LOG;
                }
            }

            if (buffer.length > 1000000) {
                const delta = buffer.length - 20000;
                bufferDelta += delta;
                buffer = buffer.slice(delta);
            }

            if (tcodes.length > 0) {
                cb({ tcodes: tcodes, hcodes: hcodes });
            }
        }
    });
}