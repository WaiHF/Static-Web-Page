"use strict";

// Array of layer objects that correspond to each canvas layer.
const layers = [
    new Canvas('background', true),
    new Canvas('foreground', false),
    new Canvas('interact', false)
];

// calls init when the page loads.
window.onload = init();

// used to start everything. mainly animation right now.
function init() {
    // resize once to correct canvas resolution on load.
    resizeAll()

    for (let l of layers) {
        l.startAni();
    }
}

// calls for all layer objects to resize.
function resizeAll() {
    for (let l of layers) {
        l.resize();
        l.draw();
    }
}

// Generates random colour code.
function randomColour() {
    const colourCodes = '0123456789ABCDEF';
    let code = '#';
    for (var i = 0; i < 6; i++) {
        code = code + colourCodes[Math.floor(Math.random() * 16)];
    }
    return code;
}