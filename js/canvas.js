"use strict";

class Canvas {
    #canvas;
    #ctx;
    #renderQueue;
    #requestId;

    constructor(element) {
        this.#canvas = element;
        this.#ctx = this.#canvas.getContext(
            '2d',
            this.#canvas.id === 'background' ? { alpha: false } : { alpha: true }
        )
        // resizes canvas on obj creation.
        this.resize();

        this.#renderQueue = [];
        this.#requestId = undefined;
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
        if (this.#canvas.id === 'background') {
            this.#ctx.fillStyle = '#f8f8f8'
            this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
        };
        
        this.#ctx.fillStyle = randomColour();
        let coords = randomCoords(this.#canvas.width, this.#canvas.height)
        this.#ctx.fillRect(coords.x, coords.y, 20, 20);
    }

    resize() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }
}