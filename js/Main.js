// Creates a canvas object.
var canvasObj = new Canvas();

document.getElementById("save_button").addEventListener("mousedown", canvasObj.graphObj.saveGraph);
document.getElementById("load_button").addEventListener("mousedown", canvasObj.graphObj.loadGraph);
document.getElementById("clear_button").addEventListener("mousedown", canvasObj.graphObj.clearGraph);

// Redraws the canvas and updated the offset values when window is resized.
window.onresize = function (event) {
    canvasObj.resize();
    canvasObj.draw();
}
