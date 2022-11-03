class Canvas {
    constructor() {
        // canvas attribute variables.
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.offsetX = this.ctx.canvas.getBoundingClientRect().left;
        this.offsetY = this.ctx.canvas.getBoundingClientRect().top;

        // Interaction related variables.
        this.prevMX = 0;
        this.prevMY = 0;
        this.workingObjs = [];
        this.tempObj = undefined;
        this.selectSquare = undefined;
        this.isSelecting = false;
        // Super lazy method to offset pasted in objects.
        this.pasteCount = 0;


        // Binds events to canvas related functions.
        this.canvas.addEventListener("dblclick", this.mouseDDown);
        this.canvas.addEventListener("mousedown", this.mouseDown);
        this.canvas.addEventListener("mouseup", this.mouseUp);
        this.canvas.addEventListener("mousemove", this.mouseMove);
        this.canvas.addEventListener("dragover", this.dragOver);
        this.canvas.addEventListener("drop", this.drop);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);
        this.canvas.addEventListener("keydown", this.keyDown);

        // Binding these to elements seem to only work in Firefox 74.0 and not Chrome 0.0.3987.149.
        /*
        this.canvas.addEventListener("copy", this.copy);
        this.canvas.addEventListener("cut", this.cut);
        this.canvas.addEventListener("paste", this.paste);
        */

        // Binding to document instead of canvas is a workaround for Chrome.
        document.addEventListener("copy", this.copy);
        document.addEventListener("cut", this.cut);
        document.addEventListener("paste", this.paste);

        // Creates the graph object.
        this.graphObj = new ERD();
        // Creats a property menu object.
        this.propMenu = new PropertyMenu();

        // Resizes the canvas to fit the displayed canvas.
        this.resize();
    }

    // Handles double mouse down functions.
    mouseDDown = e => {
        // Stops the default event.
        e.preventDefault();

        // Gets the current mouse position.
        const mX = e.clientX - this.offsetX;
        const mY = e.clientY - this.offsetY;

        this.openObjPropMenu(mX, mY);
    }

    // Handles mouse down functions. Ref: https://stackoverflow.com/questions/24926028/drag-and-drop-multiple-objects-in-html5-canvas
    mouseDown = e => {
        // Stops the default event.
        e.preventDefault();

        // Sets focus on the cavnas to allow for the registration of keydowns, copy, paste only after the canvas is clicked on.
        e.target.focus();

        // Gets the current mouse position.
        const mX = e.clientX - this.offsetX;
        const mY = e.clientY - this.offsetY;

        // Checks which mouse button was pressed
        switch (e.button) {
            case 0:
                // Checks which key was pressed.
                if (e.ctrlKey) {
                    this.selectMultiObjs(mX, mY);
                } else {
                    this.selectSingleObj(mX, mY);
                }
                break;
            case 2:
                this.selectMultiObjs(mX, mY);
                break;
            default:
                break;
        }

        // If nothing is selected then start to draw the selection box.
        if (!(this.getLastHitLink(mX, mY) || this.getLastHitNode(mX, mY))) {
            this.isSelecting = true;
        }

        // Redraws the canvas.
        this.draw();
    }

    // Handles the dragOver function
    dragOver = e => {
        // Stops the default event.
        e.preventDefault();

        // Gets the current mouse position.
        const mX = e.clientX - this.offsetX;
        const mY = e.clientY - this.offsetY;

        // if tempObj is undefined then call graphObj to make one. Otherwise update ghost position.
        if (!this.tempObj) {
            // Generates the ghost object, and resets the prev variables to keep positioning correct.
            this.getGhostMenuObj(e.dataTransfer.types[e.dataTransfer.types.length - 1]);
        } else {
            // Calculates the distance the cursor has moved since the last dragOver event.
            const dX = mX - this.prevMX;
            const dY = mY - this.prevMY;

            // Saves the cursor location for the next dragOver event.
            this.prevMX = mX;
            this.prevMY = mY;

            // Moves the ghost object.
            this.tempObj.moveTo(dX, dY);
            this.draw();
        }
    }

    // Handles mouse move functions. Ref: https://stackoverflow.com/questions/24926028/drag-and-drop-multiple-objects-in-html5-canvas
    mouseMove = e => {
        // Stops the default event.
        e.preventDefault();

        // Used to differentiate between resizing and dragging.
        let resizeLock = false;
        let dragLock = false;

        // Gets the current mouse position.
        const mX = e.clientX - this.offsetX;
        const mY = e.clientY - this.offsetY;
        // Calculates the distance the cursor has moved since the last mouseMove event.
        const dX = mX - this.prevMX;
        const dY = mY - this.prevMY;

        // Sets focus status on moused over objects.
        this.updateFocusObjs(mX, mY);

        // If there's a working object then check if they need to update.
        if (this.workingObjs.length >= 1) {
            for (let workingObj of this.workingObjs) {
                if (workingObj.isResizing) {
                    resizeLock = true;
                } else if (workingObj.isDragging && !resizeLock) {
                    dragLock = true;
                }
            }
        }

        // Update resize objs exclusively, or dragging objects if either lock is on.
        // if neither then draw the selection square.
        if (resizeLock) {
            this.updateResizingObjs(dX, dY);
        } else if (dragLock) {
            this.updateMovingObjs(dX, dY);
        } else if (this.isSelecting && e.buttons === 1 || e.buttons === 2) {
            // e.buttons gets the mouse button press while mouse move. Without it fast clicks will initiate square selection, but mouseUp wouldn't have been called to cancel it.
            this.updateSelectionSquare(mX, mY);
        }

        // Saves the cursor location for the next mouseMove event.
        this.prevMX = mX;
        this.prevMY = mY;

        // Redraws the scene.
        this.draw();
    }

    // Handles mouse up function . Ref: https://stackoverflow.com/questions/24926028/drag-and-drop-multiple-objects-in-html5-canvas
    mouseUp = e => {
        // Stops the default event.
        e.preventDefault();

        // Resets the workingObjs dragging/resizing attributes. Link objects will look for a anchor if resizing.
        for (let workingObj of this.workingObjs) {
            this.updateStoppedObj(workingObj);
        }

        // resets the canvas' interaction attributes.
        if (this.isSelecting && this.selectSquare) {
            // Checks which mouse button was pressed
            switch (e.button) {
                case 0:
                    // Checks which key was pressed.
                    if (e.ctrlKey) {
                        this.selectMultiSelectSquareObjs();
                    } else {
                        this.selectSingleSelectSquareObjs();
                    }
                    break;
                case 2:
                    this.selectMultiSelectSquareObjs();
                    break;
                default:
                    break;
            }
            this.isSelecting = false;
            this.selectSquare = undefined;
        }

        // Redraws the scene
        this.draw();
    }

    // Creates objects on the canvas depending on what was dropped. Ref: https://stackoverflow.com/questions/13578657/how-to-drag-an-image-after-drop-onto-html5-canvas
    drop = e => {
        // Stops the default event.
        e.preventDefault();

        // Gets the current mouse position.
        const mX = e.clientX - this.offsetX;
        const mY = e.clientY - this.offsetY;

        // Creates a menu item on the canvas with the mouse pos as origin.
        this.graphObj.generateObj(e.dataTransfer.types[e.dataTransfer.types.length - 1], mX, mY);

        // Redraws the scene.
        this.draw();
    }

    // Handles the keyDown function.
    keyDown = e => {
        switch (e.key) {
            // removes all objects that were in the workingObjs.
            case "Delete":
                for (let workingObj of this.workingObjs) {
                    this.graphObj.removeObj(workingObj);
                }
                // Just in case clean up.
                this.emptyWorkingObjs();
                break;
            default:
                break;
        }

        // Redraws the scene.
        this.draw();
    }

    // Handles the Copy event.
    copy = e => {
        // If the canvas is the focused element.
        if (document.activeElement.tagName === "CANVAS") {
            // Stops the default event.
            e.preventDefault();
            // If there are selected objects to copy.
            if (this.workingObjs.length > 0) {
                // Saves a copy of selected objects to the clipboard in JSON form.
                e.clipboardData.setData('text/plain', this.graphObj.copyObjs(this.workingObjs));
                // Resets paste count.
                this.pasteCount = 0;
            }
        }
    }

    // Handles the Cut event.
    cut = e => {
        // If the canvas is the focused element.
        if (document.activeElement.tagName === "CANVAS") {
            // Stops the default event.
            e.preventDefault();
            // If there are selected objects to copy.
            if (this.workingObjs.length > 0) {
                // Saves a copy of selected objects to the clipboard in JSON form.
                e.clipboardData.setData('text/plain', this.graphObj.copyObjs(this.workingObjs));
                // Deletes the selected objects.
                for (let workingObj of this.workingObjs) {
                    this.graphObj.removeObj(workingObj);
                }
                // Resets paste count.
                this.pasteCount = 0;

                // Redraws the canvas.
                this.draw();
            }
        }
    }

    // Handles the Paste event.
    paste = e => {
        // If the canvas is the focused element.
        if (document.activeElement.tagName === "CANVAS") {
            try {
                // Places the saved objects in the clipboad on to the canvas & returns the new pasted items.
                let pastedObjs = this.graphObj.pasteObjs(JSON.parse(e.clipboardData.getData('text/plain')));
                // If there are objects to paste then.
                if (pastedObjs) {
                    // Increases paste count to increase offset.
                    this.pasteCount++;
                    // Deselects previously selected items.
                    this.emptyWorkingObjs();
                    // Adds pasted in objects to workingObjs and selects them.
                    for (let o of pastedObjs) {
                        o.isSelected = true;
                        this.workingObjs.push(o);
                    }
                    // adds offset to the pasted in objects.
                    this.updateMovingObjs(this.pasteCount * 20, this.pasteCount * 20);
                }

                // Redraws the canvas.
                this.draw();
            } catch (e) {};
        }
    }

    // Prevents the context menu from opening on the canvas.
    onContextMenu = e => {
        e.preventDefault();
    }

    // Gets the last Link that registers a hit.
    getLastHitLink(mX, mY) {
        let resizeLock = false;
        let selectedObj = undefined;

        for (let linkObj of this.graphObj.links) {
            if (linkObj.returnResizeHit(mX, mY)) {
                selectedObj = linkObj;
                resizeLock = true;
            } else if (linkObj.returnHit(mX, mY) && !resizeLock) {
                selectedObj = linkObj;
            }
        }

        return selectedObj;
    }

    // Gets the last Node that registers a hit.
    getLastHitNode(mX, mY) {
        let selectedObj = undefined;

        for (let nodeObj of this.graphObj.nodes) {
            if (nodeObj.returnHit(mX, mY)) {
                selectedObj = nodeObj;
            }
        }

        return selectedObj;
    }

    // Selects a single object on canvas.
    selectSingleObj(mX, mY) {
        // Gets last hit link.
        let selectedObj = this.getLastHitLink(mX, mY);

        // If no link was hit then look for a node.
        if (!selectedObj) {
            selectedObj = this.getLastHitNode(mX, mY);
        }

        // If a object is hit and it's in workingObjs and the array is larger then 1 then set all workingObjs to move. If a object is hit and it's not in workingObjs or workingObjs is smaller/= to 1 then empty workingObjs and add hit object. if no object is hit then empty workingObjs.
        if (selectedObj && this.workingObjs.length > 1 && this.workingObjs.includes(selectedObj)) {
            for (let workingObj of this.workingObjs) {
                workingObj.isSelected = true;
                if (workingObj.returnResizeHit(mX, mY)) {
                    workingObj.isResizing = true;
                } else {
                    workingObj.isDragging = true;
                }
            }
        } else if (selectedObj && (this.workingObjs.length <= 1 || !this.workingObjs.includes(selectedObj))) {
            this.emptyWorkingObjs();
            this.workingObjs.push(selectedObj);
            this.workingObjs[0].isSelected = true;
            if (this.workingObjs[0].returnResizeHit(mX, mY)) {
                this.workingObjs[0].isResizing = true;
            } else {
                this.workingObjs[0].isDragging = true;
            }
        } else {
            this.emptyWorkingObjs();
        }
    }

    // Used to select multiple objects on the canvas.
    selectMultiObjs(mX, mY) {
        // Gets last hit link.
        let selectedObj = this.getLastHitLink(mX, mY);

        // If no link was hit then look for a node.
        if (!selectedObj) {
            selectedObj = this.getLastHitNode(mX, mY);
        }

        // If a object is hit and it's not in workingObjs then add it to the array. If a object is hit and it's in workingObjs then remove it.
        if (selectedObj && !this.workingObjs.includes(selectedObj)) {
            this.workingObjs.push(selectedObj);
            this.workingObjs[this.workingObjs.length - 1].isSelected = true;
        } else if (selectedObj && this.workingObjs.includes(selectedObj)) {
            let temp = this.workingObjs[this.workingObjs.indexOf(selectedObj)];
            temp.isDragging = false;
            temp.isResizing = false;
            temp.isSelected = false;
            this.workingObjs.splice(this.workingObjs.indexOf(selectedObj), 1);
        }
    }

    // Used to select objects inside the selection square.
    selectSingleSelectSquareObjs() {
        let selectedObjs = this.getObjsInSelectionSquare()

        // Removes all working objects first.
        this.emptyWorkingObjs();

        // Sets all returned objects to selected and adds them to the workingObjs array.
        for (let o of selectedObjs) {
            o.isSelected = true;
            this.workingObjs.push(o);
        }
    }

    // Used to select objects inside the selection square, but keep previously selected objects outside the square.
    selectMultiSelectSquareObjs() {
        let selectedObjs = this.getObjsInSelectionSquare()

        // If there are objects in the selection square then check if they're already in the workingObjs array otherwise clear the workingObjs array.
        if (selectedObjs.length > 0) {
            for (let o of selectedObjs) {
                // Tries to get a matching index in workingObj with the current object.
                let repeatObjI = this.workingObjs.indexOf(o);
                // If there is a match then reset the matching objects properties, and remove it from workingObjs.
                if (repeatObjI !== -1) {
                    this.workingObjs[repeatObjI].isDragging = false;
                    this.workingObjs[repeatObjI].isResizing = false;
                    this.workingObjs[repeatObjI].isSelected = false;
                    this.workingObjs[repeatObjI].isFocused = false;
                    this.workingObjs.splice(repeatObjI, 1);
                } else {
                    this.workingObjs.push(o);
                    this.workingObjs[this.workingObjs.length - 1].isSelected = true;
                }
            }
        } else {
            this.emptyWorkingObjs();
        }
    }

    getObjsInSelectionSquare() {
        let top, right, bottom, left;
        let selectedObjs = [];

        // Gets the top and bottom coords for the selection box.
        if (Math.sign(this.selectSquare.height) !== -1) {
            top = this.selectSquare.startY;
            bottom = top + this.selectSquare.height;
        } else {
            // if the box is inverted. The first and only bit of maths that I didn't google. A absolute miracle.
            top = this.selectSquare.startY + this.selectSquare.height;
            bottom = top + Math.abs(this.selectSquare.height);
        }

        // Gets the left and right coords for the selection box.
        if (Math.sign(this.selectSquare.width) !== -1) {
            left = this.selectSquare.startX;
            right = left + this.selectSquare.width;
        } else {
            // if the box is inverted. The first and only bit of maths that I didn't google. A absolute miracle.
            left = this.selectSquare.startX + this.selectSquare.width;
            right = left + Math.abs(this.selectSquare.width);
        }

        // Checks if links are in the selection square.
        for (let linkObj of this.graphObj.links) {
            let allPointsIn = true;
            // Checks if all link points are within the selection square.
            for (let i = 0; i < linkObj.xCoords.length; i++) {
                if (linkObj.xCoords[i] < left ||
                    linkObj.xCoords[i] > right ||
                    linkObj.yCoords[i] < top ||
                    linkObj.yCoords[i] > bottom) {
                    allPointsIn = false;
                }
            }

            // If the current link's points are within the square then select it.
            if (allPointsIn) {
                selectedObjs.push(linkObj);
            }
        }

        for (let nodeObj of this.graphObj.nodes) {
            let allPointsIn = true;
            // Checks if all link points are within the selection square.
            if (nodeObj.startX < left ||
                (nodeObj.startX + nodeObj.width) > right ||
                nodeObj.startY < top ||
                (nodeObj.startY + nodeObj.height) > bottom) {
                allPointsIn = false;
            }

            // If the current link's points are within the square then select it.
            if (allPointsIn) {
                selectedObjs.push(nodeObj);
            }
        }

        return selectedObjs;
    }

    // Sets the focus dots on objects on mouseover.
    updateFocusObjs(mX, mY) {

        if (this.isSelecting && this.selectSquare) {
            let focusedObjs = this.getObjsInSelectionSquare();

            for (let linkObj of this.graphObj.links) {
                linkObj.isFocused = false;
                if (focusedObjs.includes(linkObj)) {
                    linkObj.isFocused = true;
                }
            }

            for (let nodeObj of this.graphObj.nodes) {
                nodeObj.isFocused = false;
                if (focusedObjs.includes(nodeObj)) {
                    nodeObj.isFocused = true;
                }
            }
        } else {

            // Used to hold objects that have been hit.
            let linkObjTemp = null;
            let nodeObjTemp = null;

            // Looks for hits on Links.
            for (let linkObj of this.graphObj.links) {
                linkObj.isFocused = false;
                if (linkObj.returnHit(mX, mY) || linkObj.returnResizeHit(mX, mY)) {
                    linkObjTemp = linkObj;
                }
            }
            // Only last hit link is focused.
            if (linkObjTemp !== null) {
                linkObjTemp.isFocused = true;
            }

            // Looks for hits on Nodes.
            for (let nodeObj of this.graphObj.nodes) {
                nodeObj.isFocused = false;
                if (nodeObj.returnHit(mX, mY)) {
                    nodeObjTemp = nodeObj;
                }
            }
            // Only last hit node is focused.
            if (nodeObjTemp !== null) {
                nodeObjTemp.isFocused = true;
                nodeObjTemp.returnAttrHit(mX, mY);
            }
        }
    }

    // Moves all objects that should be moving.
    updateMovingObjs(dX, dY) {
        for (let workingObj of this.workingObjs) {
            // If workingObjs array has more than 2 elements then set "groupMove" in moveTo to true. This keeps the links connected to the node when move together.
            if (this.workingObjs.length >= 2) {
                workingObj.moveTo(dX, dY, true);
            } else {
                workingObj.moveTo(dX, dY);
            }
        }
    }

    // Resizes the top working object.
    updateResizingObjs(dX, dY) {
        // Top working Object is resized.
        let workingObj = this.workingObjs.find(workingObjs => workingObjs.isResizing === true);
        if (Object.getPrototypeOf(Object.getPrototypeOf(workingObj)).constructor.name === "Link") {
            workingObj.movePoint(dX, dY);
        }
    }

    updateStoppedObj(workingObj) {
        workingObj.isDragging = false;
        if (workingObj.isResizing) {
            workingObj.isResizing = false;
            if (Object.getPrototypeOf(Object.getPrototypeOf(workingObj)).constructor.name === "Link") {
                workingObj.findAnchor();
                // Regenerates the property menu after link tries to find an anchor.
                this.updatePropMenu();
            }
        }
    }

    // Generates the ghost object, and resets the prev variables to keep positioning correct.
    getGhostMenuObj(itemID) {
        this.tempObj = this.graphObj.returnGhostObj(itemID);
        this.prevMX = 0;
        this.prevMY = 0;
    }

    // Resets all working objects attributes and clears the array.
    emptyWorkingObjs() {
        for (let workingObj of this.workingObjs) {
            workingObj.isDragging = false;
            workingObj.isResizing = false;
            workingObj.isSelected = false;
        }
        this.workingObjs = [];
    }

    // Closes the current property menu and sets the given menu as the new property menu.
    setPropMenu(objMenu) {
        if (this.propMenu !== objMenu) {
            this.propMenu.closeMenu();
            this.propMenu = objMenu;
        }
    }

    // Opens the hit object's property menu.
    openObjPropMenu(mX, mY) {
        // Set to last hit link.
        let selectedObj = this.getLastHitLink(mX, mY);

        // If no link was hit then look for a node.
        if (!selectedObj) {
            selectedObj = this.getLastHitNode(mX, mY);
        }

        // If there's a hit object then get it's property menu.
        if (selectedObj) {
            let menu = selectedObj.getPropMenu();
            // If the menu is not the default then generate then set the canvas' prop menu as the objects prop menu.
            if (Object.getPrototypeOf(menu).constructor.name !== "PropertyMenu") {
                this.setPropMenu(menu);
                this.propMenu.generateMenu(true);
            }
        }
    }

    // Opens the hit object's property menu.
    updatePropMenu() {
        if (Object.getPrototypeOf(this.propMenu).constructor.name !== "PropertyMenu" && this.propMenu.open) {
            this.propMenu.generateMenu(false);
        }
    }

    // Creates the selection square if there is not one.
    // Updates the selection square if there is one.
    updateSelectionSquare(mX, mY) {
        // If the canvas is selecting and there is not a selectSquare.
        if (this.isSelecting && !this.selectSquare) {
            this.selectSquare = {
                startX: parseInt(mX),
                startY: parseInt(mY),
                width: 0,
                height: 0
            }

        } else if (this.isSelecting && this.selectSquare) {

            // Calculates the distance the cursor has moved since the last mouseMove event.
            let dX = mX - this.prevMX;
            let dY = mY - this.prevMY;

            // Updates the selectSquare width and height.
            this.selectSquare.width += dX;
            this.selectSquare.height += dY;

            // Attempt to improve performance.
            Math.abs(this.selectSquare.width);
            Math.abs(this.selectSquare.height);
        }
    }

    //Draws the selection square.
    drawSelectionSquare(mX, mY) {
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#99d4ff";
        this.ctx.fillStyle = "#cce9ff";
        this.ctx.beginPath();
        this.ctx.rect(this.selectSquare.startX, this.selectSquare.startY, this.selectSquare.width, this.selectSquare.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Draws the scene. Ref: https://stackoverflow.com/questions/24926028/drag-and-drop-multiple-objects-in-html5-canvas
    draw() {
        // Clears the canvas every draw.
        this.clear();

        // Draws the selection square.
        if (this.selectSquare) {
            this.drawSelectionSquare();
        }

        // Draws all nodes
        for (let nodeObj of this.graphObj.nodes) {
            nodeObj.draw();
        }

        // Draws all links
        for (let linkObj of this.graphObj.links) {
            linkObj.draw();
        }

        // Draws the dragged on object.
        // Performance drops after 10+ objects on canvas. Calling draws multiple times might be why it's so bad.
        if (this.tempObj) {
            this.tempObj.draw();
        }
    }

    // Clears the canvas. Ref: https://stackoverflow.com/questions/24926028/drag-and-drop-multiple-objects-in-html5-canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Resizes the canvas based on the size displayed on the client window. Ref: https://stackoverflow.com/questions/4938346/canvas-width-and-height-in-html5
    resize() {
        if (this.canvas.height !== this.canvas.clientHeight || this.canvas.width !== this.canvas.clientWidth) {
            this.canvas.height = this.canvas.clientHeight;
            this.canvas.width = this.canvas.clientWidth;
            // Gets the new offset in case main menu or item menu changes size.
            this.offsetX = this.ctx.canvas.getBoundingClientRect().left;
            this.offsetY = this.ctx.canvas.getBoundingClientRect().top;
        }
    }
};
