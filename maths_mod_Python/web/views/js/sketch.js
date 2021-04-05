var source_file; // sound file
var src_length; // hold its duration

var pg; // to draw waveform

var playing = false;
var button;

function preload() {
    source_file = loadSound(file); // preload the sound
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('#sketch');
    textAlign(CENTER);

    src_length = source_file.duration();
    source_file.playMode('restart');

    var peaks = source_file.getPeaks();
    pg = createGraphics(width, 150);
    pg.background('white');
    pg.translate(0, 75);
    pg.noFill();
    pg.stroke(0);

    for (var i = 0; i < peaks.length; i++) {
        var x = map(i, 0, peaks.length, 0, width);
        var y = map(peaks[i], 0, 1, 0, 150);
        pg.line(x, 0, x, y);
        pg.line(x, 0, x, -y);
    }

    fft = new p5.FFT(0.9, 256);
    source_file.amp(0.2);
}

function draw() {
    background(0);

    heightCanva1 = windowHeight - 165;


    let spectrum = fft.analyze();
    stroke(255); // spectrum is green
    for (var i = 0; i < spectrum.length; i++) {
        let x = map(i, 0, spectrum.length, 0, width);
        let h = -heightCanva1 + map(spectrum[i], 0, 255, heightCanva1, 0);
        fill(i, 0, 255);
        rect(x, heightCanva1, width / spectrum.length, h)
    }
    stroke(255);

    /*let waveform = fft.waveform();
    noFill();
    beginShape();
    stroke(255, 0, 0); // waveform is red
    strokeWeight(5);
    for (var i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, 0, width);
        let y = map(waveform[i], -1, 1, 0, heightCanva1);
        vertex(x, y);
    }
    endShape();*/

    image(pg, 0, heightCanva1); // display our waveform representation
    fill('red');
    noStroke();
    rect(map(source_file.currentTime(),0,src_length,0,windowWidth),heightCanva1,3,150);

    if (source_file.currentTime() >= src_length - 0.05) {
        source_file.pause();
    }
}

function mouseClicked() {
    if (mouseY > heightCanva1 && mouseY < 250 + heightCanva1) {
        var playpos = constrain(map(mouseX, 0, windowWidth, 0, src_length), 0, src_length);
        source_file.play();
        source_file.play(0, 1, 1, playpos, src_length);
        playing = true;
    }
    return false;
}

function keyTyped() {
    if (key == ' ') {
        play();
    }
    return false;
}

function play() {
    if (playing) {
        source_file.pause();
        playing = false;
    }
    else {
        source_file.play();
        playing = true;
    }
}