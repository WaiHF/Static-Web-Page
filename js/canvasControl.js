"use strict";

class CanvasControl {
    #graph;
    #layers;
    #toggle;

    constructor(graph, layers) {
        this.#graph = graph;
        this.#layers = layers;
        // TESTING.
        this.#toggle = true;

        // When the window is resized / zoomed in and out all canvases must be resized.
        window.addEventListener('resize', () => this.resizeAll(), false);
        // TESTING.
        window.addEventListener('click', () => this.startStopAni(), false);
        this.startStopAni();
    }

    // TESTING.
    startStopAni() {
        if (this.#toggle) {
            for (let l of this.#layers) {
                l.startAnimation();
                this.#toggle = false;
            }
        } else {
            for (let l of this.#layers) {
                l.stopAnimation();
                this.#toggle = true;
            }
        }
    }

    // calls for all layer objects to resize.
    resizeAll() {
        for (let l of this.#layers) {
            l.resize();
        }
    }
}

