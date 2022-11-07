"use strict";

// gets the canvas element and sets the context. Need to move to own class.
const backLayer = document.getElementById('background');
const backCtx = backLayer.getContext('2d');

const foreLayer = document.getElementById('foreground');
const foreCtx = foreLayer.getContext('2d');

const interLayer = document.getElementById('interaction');
const interCtx = interLayer.getContext('2d');

// calls init when the page loads.
window.onload = init();

// Calls the resize function when the window is resized / zoomed in and out.
window.addEventListener('resize', resizeCanvas, false);

// used to start everything. mainly animation right now.
function init() {
    // resize once to correct canvas resolution on load.
    resizeCanvas()

    window.requestAnimationFrame(refresh);
}

// calls draw based on requestAnimationFrame.
function refresh(timeStamp) {
    draw();

    window.requestAnimationFrame(refresh);
}

// 
function draw() {
    backCtx.fillStyle = randomColour();
    backCtx.fillRect(230, 230, 110, 110);

    foreCtx.fillStyle = randomColour();
    foreCtx.fillRect(120, 120, 110, 110);

    interCtx.fillStyle = randomColour();
    interCtx.fillRect(10, 10, 110, 110);
}

// resizes canvas resolution based on size
function resizeCanvas() {
    backLayer.width = window.innerWidth;
    backLayer.height = window.innerHeight;

    foreLayer.width = window.innerWidth;
    foreLayer.height = window.innerHeight;

    interLayer.width = window.innerWidth;
    interLayer.height = window.innerHeight;

    draw();
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