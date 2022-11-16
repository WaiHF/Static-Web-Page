"use strict";

// runs when page loads.
window.addEventListener('load', () => {
    // Array of layer objects that correspond to each canvas layer.
    const layers = [
        new Canvas(document.getElementById('background')),
        new Canvas(document.getElementById('foreground')),
        new Canvas(document.getElementById('interact'))
    ];

    let graph = new Graph(layers);
    let canvasControl = new CanvasControl(graph, layers);
}, false);

// Generates random colour code.
function randomColour() {
    const colourCodes = '0123456789ABCDEF';
    let code = '#';
    for (let i = 0; i < 6; i++) {
        code += colourCodes[Math.floor(Math.random() * 16)];
    }
    return code;
}

// generates random coordinates based on max canvas x and y.
function randomCoords(maxX, maxY) {
    let x = maxX ? Math.floor(Math.random() * maxX) : 0;
    let y = maxY ? Math.floor(Math.random() * maxY) : 0;

    return {
        x: x,
        y: y
    };
}