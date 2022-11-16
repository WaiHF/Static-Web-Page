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

        // When the window is resized / zoomed in and out, all canvases must be resized.
        // needs to be improved, but just testing at the moment.
        window.addEventListener('resize', () => this.resizeAll());

        // TESTING.
        this.#layers[2].getCanvas().addEventListener('click', () => this.toggleAnimate());
        this.toggleAnimate();

        this.#layers[2].getCanvas().addEventListener('mousedown', (e) => this.onMouseDown(e))
        this.#layers[2].getCanvas().addEventListener('mouseup', (e) => this.onMouseUp(e))
        this.#layers[2].getCanvas().addEventListener('mousemove', (e) => this.onMouseMove(e))
        this.#layers[2].getCanvas().addEventListener('wheel', (e) => this.onWheel(e))
    }

    onMouseDown(e) {

    }

    onMouseUp(e) {

    }

    onMouseMove(e) {

    }

    onWheel(e) {
        let zoomAmount = e.deltaY * this.#layers[2].getZoomSens().toFixed(4);

        for (let l of this.#layers) {
            l.setZoom(l.getZoom() + zoomAmount);
        }
    }

    // TESTING.
    toggleAnimate() {
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