"use strict";

class Canvas {
    #canvas;
    #ctx;
    #renderQueue = [];
    #requestId = undefined;

    // control variables.
    #zoom = 1;
    #minZoom = 5;
    #maxZoom = 0.5;
    #zoomSens = 0.001;

    constructor(element) {
        // sets a canvas and context for this canvs object.
        this.#canvas = element;
        this.#ctx = this.#canvas.getContext(
            '2d',
            this.#canvas.id === 'background' ? { alpha: false } : { alpha: true }
        )

        // resizes canvas on object creation so it will fit the screen.
        this.resize();
    }

    getCanvas() {
        return this.#canvas;
    }

    getZoom() {
        return this.#zoom;
    }
    setZoom(zoom) {
        zoom = Math.min(zoom, this.#minZoom );
        zoom = Math.max(zoom, this.#maxZoom );

        this.#zoom = Math.round(Number(zoom) * 1000) / 1000;
        
        console.log('zoom amount recieved =' + zoom)
    }
    getZoomSens() {
        return this.#zoomSens;
    }

    startAnimation() {
        this.#requestId = window.requestAnimationFrame(() => this.startAnimation());
        this.draw();
    }

    stopAnimation() {
        if (this.#requestId) {
            window.cancelAnimationFrame(this.#requestId);
            this.#requestId = undefined;
        }
    }

    draw() {
        this.resize();

        if (this.#canvas.id === 'background') {
            this.#ctx.fillStyle = '#f8f8f8'
            this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
        };

        this.#ctx.scale(this.#zoom, this.#zoom);
        this.#ctx.fillStyle = randomColour();
        let coords = randomCoords(this.#canvas.width, this.#canvas.height)
        this.#ctx.fillRect(10, 20, 20, 20);
        
    }

    resize() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }
}