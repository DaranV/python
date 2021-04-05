const TAILLE_SPECTRE = 512; 
const FREQ_ECHANTILLON = 22050;
const MASK_DF = 3;

const HANNING = new Array(TAILLE_SPECTRE);
for (var i = 0; i < TAILLE_SPECTRE; i++) {
    HANNING[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (TAILLE_SPECTRE - 1)));
}

const GAUSSIAN_MASK = new Array(TAILLE_SPECTRE / 2);
for (let i = 0; i < TAILLE_SPECTRE / 2; i++) {
    GAUSSIAN_MASK[i] = new Array(TAILLE_SPECTRE / 2);
    for (let j = 0; j < TAILLE_SPECTRE / 2; j++) {
        GAUSSIAN_MASK[i][j] = -0.5 * Math.pow((j - i) / MASK_DF / Math.sqrt(i + 3), 2);
    }
}

var self = {
    FREQ_ECHANTILLON: FREQ_ECHANTILLON,
    OCTET_PAR_ECHANTILLON: 2, //échantillon sur 16 bits, 16 bits = 2 octets
    NOMBRE_MAX_PEAKS: 5,
    NOMBRE_PAIRS_PEAKS: 3,
    TAILLE_SPECTRE: TAILLE_SPECTRE,
    STEP: TAILLE_SPECTRE / 2,
    DT: 1 / (FREQ_ECHANTILLON / (TAILLE_SPECTRE/2)),
    FENETRE_HANNING: HANNING,
    MASK_DECAY_LOG: Math.log(0.995),
    IF_MIN: 0,
    IF_MAX: TAILLE_SPECTRE / 2,
    WINDOW_DF: 60,
    WINDOW_DT: 96,
    PRUNING_DT: 24,
    MASK_DF: MASK_DF,
    GAUSSIAN_MASK: GAUSSIAN_MASK,
    FFMPEG: {
        CODEC: 'pcm_s16le',
        FORMAT: 'wav',
        NB_CHANNEL: 1
    }
};

module.exports = self;