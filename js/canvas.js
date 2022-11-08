"use strict";

class Canvas {
    #canvas;
    #ctx;
    #renderQueue;
    #requestId;

    constructor(elementId, opaque) {
        this.#canvas = document.getElementById(elementId);
        this.#ctx = this.#canvas.getContext(
            '2d',
            opaque ? { alpha: false } : { alpha: true }
        )

        this.#renderQueue = [];
        this.#requestId = undefined;
    }

    getCanvas() {
        return this.#canvas;
    }

    getCtx() {
        return this.#ctx;
    }

    startAni() {
        this.#requestId = window.requestAnimationFrame(() => this.startAni());
        this.draw();
    }

    stopAni() {
        if (this.#requestId) {
            window.cancelAnimationFrame(this.#requestId);
            this.#requestId = undefined;
        }
    }

    draw() {
        this.#ctx.fillStyle = '#f8f8f8'
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height)
        this.#ctx.fillStyle = randomColour();
        this.#ctx.fillRect(230, 230, 110, 110);
    }

    resize() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }
}