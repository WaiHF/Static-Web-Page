class Link {
    constructor(id, startX, startY, endX, endY) {
        // Link specific vars.
        this.id = id;
        this.xCoords = [startX, endX];
        this.yCoords = [startY, endY];
        this.connectedNodes = {
            0: {
                id: undefined
            },
            1: {
                id: undefined
            }
        };
        // UI specific vars.
        this.isDragging = false;
        this.isSelected = false;
        this.isFocused = false;
        this.isResizing = false;
        this.resizeXIndex = "";
        this.resizeYIndex = "";
        this.errors = {};
    }

    // Sets a id for the link.
    setID(id) {
        this.id = id;
        return this;
    }

    // Checks if coordinates are within the drawn link.
    returnHit(mX, mY) {
        var hit = false;
        this.draw();
        if (canvasObj.ctx.isPointInStroke(mX, mY)) {
            hit = true;
        }
        return hit;
    }

    // Moves the link.
    moveTo(dX, dY, groupMove) {
        // Updates the link start and end coordinates with the distance provided.
        for (let i = 0; i < this.xCoords.length; i++) {
            this.xCoords[i] += parseInt(dX);
            this.yCoords[i] += parseInt(dY);
        }

        // If it's attached to a node and is move in a group then revert the move distance called by the node. Otherwise disconnect the node, as it is moved off the node.
        for (let nodeNo of Object.keys(this.connectedNodes)) {
            if (this.connectedNodes[nodeNo].id) {
                let nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[nodeNo].id);
                if (groupMove === true) {
                    this.xCoords[nodeNo] -= parseInt(dX);
                    this.yCoords[nodeNo] -= parseInt(dY);
                } else {
                    this.removeNode(Number(nodeNo));
                }
            }
        }
    }

    // Moves the the clicked on point of the link.
    movePoint(dX, dY, nodeID) {
        // if a nodeID is defined then change reszing coordinates to the end of the links that's attached to the node. Allows node to move attached link.
        if (nodeID) {
            for (let nodeNo of Object.keys(this.connectedNodes)) {
                if (this.connectedNodes[nodeNo].id === nodeID) {
                    this.resizeXIndex = nodeNo;
                    this.resizeYIndex = nodeNo;
                }
            }
        }

        // Moves the point that belongs to the resizing indexes set by function returnResizeHit.
        if (this.resizeXIndex >= 0 && this.resizeYIndex >= 0) {
            this.xCoords[this.resizeXIndex] += dX;
            this.yCoords[this.resizeYIndex] += dY;
        }
    }

    // Connects the resizing end to a node.
    findAnchor() {
        // Checks if the resizing end is in a node.
        let nodeObjTemp;
        for (let nodeObj of canvasObj.graphObj.nodes) {
            if (nodeObj.returnHit(this.xCoords[this.resizeXIndex], this.yCoords[this.resizeYIndex])) {
                nodeObjTemp = nodeObj;
            }
        }

        // Moves the resizing end to the node and create the associations with the node or remove the previous node if end is not on a node.
        if (this.resizeXIndex === this.resizeYIndex) {
            if (nodeObjTemp) {
                this.removeNode(this.resizeXIndex);
                this.addNode(nodeObjTemp, this.resizeXIndex);
            } else {
                this.removeNode(this.resizeXIndex);
            }
        }
    }

    // Adds a node from a specified end of the link and adds the link id to the specified nodes connectedLinks array.
    addNode(nodeObj, end) {
        if (nodeObj.id !== this.connectedNodes[end].id) {
            this.connectedNodes[end].id = nodeObj.id;
            this.xCoords[end] = nodeObj.startX + nodeObj.width / 2;
            this.yCoords[end] = nodeObj.startY + nodeObj.height / 2;
            nodeObj.addLink(this.id);
        }
    }

    // Removes a node from a specified end of the link and updates the nodes connectedLink array if possible.
    removeNode(end) {
        if (this.connectedNodes[end].id) {
            var nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[end].id);
            nodeObj.removeLink(this.id);
            this.connectedNodes[end].id = undefined;
        }
    }

    focusDot(x, y, color) {
        canvasObj.ctx.save();
        canvasObj.ctx.beginPath();
        canvasObj.ctx.arc(x, y, 8, 0, 2 * Math.PI);
        canvasObj.ctx.closePath();
        canvasObj.ctx.fillStyle = color;
        canvasObj.ctx.fill();
        canvasObj.ctx.restore();
    }
};
class Association extends Link {
    constructor(id, startX, startY, endX, endY) {
        super(id, startX, startY, endX, endY);
        // Association specific vars.
        this.relatedAttrs = {
            0: {
                attrID: undefined,
                relation: "0...1",
                onBottom: false,
                horzPosPerc: 20
            },
            1: {
                attrID: undefined,
                relation: "0...1",
                onBottom: false,
                horzPosPerc: 20
            }
        }
        this.propMenu = undefined;

        // UI specific vars.
        this.lineWidth = 2;
        this.lineColor = "#000000";
        this.relPad0 = 20;
        this.relPad1 = 20;
    }

    // Sets the relation on the given end and relation.
    setRelatedAttrRelation(end, relation) {
        this.relatedAttrs[end].relation = relation;
        canvasObj.graphObj.updateThisAssociationErrors(this);
    }

    // Sets the attribute that the given end is assigned.
    setRelatedAttrID(end, attrID) {
        if (end === 0 || end === 1) {
            this.relatedAttrs[end].attrID = Number(attrID);

            // Attaches given end to a anchor point on the node.
            let nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[end].id);
            this.attachToAnchor(nodeObj, end);

            // Checks the validity of the affected node
            canvasObj.graphObj.updateLinkNodeErrors(this);
            canvasObj.graphObj.updateThisAssociationErrors(this);
        }
    }

    setRelatedAttrOnBottom(end, onBottom) {
        this.relatedAttrs[end].onBottom = onBottom;
    }

    setRelatedAttrHorzPosPerc(end, horzPosPerc) {
        this.relatedAttrs[end].horzPosPerc = horzPosPerc;
    }

    // Called when link needs to be saved.
    saveFormat() {
        // General attributes resets.
        this.isDragging = false;
        this.isSelected = false;
        this.isFocused = false;
        this.isResizing = false;
        this.resizeXIndex = "";
        this.resizeYIndex = "";

        // Property menu related resets.
        if (this.propMenu) {
            this.propMenu.closeMenu();
            this.propMenu = undefined;
        }
    }

    // Called when link needs to be deleted.
    deleteFormat() {
        // Removes both associations of the association before removing from array.
        this.removeNode(0);
        this.removeNode(1);

        // Property menu related closes.
        if (this.propMenu === canvasObj.propMenu) {
            this.propMenu.closeMenu();
        }
    }

    // Updates the errors.
    updateErrors(error) {
        // If the itemID doesn't already exist then create it holding an object.
        if (!this.errors[error.itemID] && error.errorType !== "valid") {
            this.errors[error.itemID] = {};
        }

        // If the itemID object does exists.
        if (this.errors[error.itemID]) {
            // If the result returned from validation isn't valid then set the category of error holding an object that has the error message, and error type. Otherwise if the category already exists and the results were valid then delete the category in the itemID object.
            if (error.errorType !== "valid") {
                this.errors[error.itemID][error.errorCat] = {
                    errorMsg: error.errorMsg,
                    errorType: error.errorType
                };
            } else if (this.errors[error.itemID][error.errorCat] && error.errorType == "valid") {
                delete this.errors[error.itemID][error.errorCat];
            }

            // If the itemID object is empty then remove it. Ref: https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
            if (Object.entries(this.errors[error.itemID]).length === 0 && this.errors[error.itemID].constructor === Object) {
                delete this.errors[error.itemID];
            }
        }
    }

    // Draws the line.
    drawLine() {
        canvasObj.ctx.save();
        canvasObj.ctx.lineWidth = this.lineWidth;
        canvasObj.ctx.strokeStyle = this.lineColor;
        canvasObj.ctx.lineCap = "round";
        // If there's a error then highlight the line.
        // invalid error take priority and are red. Warnings are yellow.
        let linkState = undefined;
        for (let errorItem of Object.keys(this.errors)) {
            for (let errorCat of Object.keys(this.errors[errorItem])) {
                if (!linkState || linkState !== "invalid") {
                    linkState = this.errors[errorItem][errorCat].errorType;
                } else if (linkState === "invalid") {
                    linkState = this.errors[errorItem][errorCat].errorType;
                }
            }
        }

        // Not sure if changing ctx settings effects the performance, so it's seperated.
        switch (linkState) {
            case "invalid":
                canvasObj.ctx.shadowColor = "#FF0000";
                canvasObj.ctx.shadowBlur = 5;
                break;
            case "warning":
                canvasObj.ctx.shadowColor = "#FF9600";
                canvasObj.ctx.shadowBlur = 5;
                break;
            default:
                break;
        }

        canvasObj.ctx.beginPath();
        canvasObj.ctx.moveTo(this.xCoords[0], this.yCoords[0]);
        canvasObj.ctx.lineTo(this.xCoords[1], this.yCoords[1]);
        canvasObj.ctx.stroke();
        canvasObj.ctx.restore();
    }

    // Draws the UI features on top of Association.
    drawBorder() {
        // If there's a connection or type error then set error state.
        // invalid error take priority and are red. Warnings are yellow.
        // This is repeated. Maybe make a function for it.
        let endState0 = undefined;
        let endState1 = undefined;
        for (let errorItem of Object.keys(this.errors)) {
            for (let errorCat of Object.keys(this.errors[errorItem])) {
                // Not sure why the +1 is needed here but not in propertyMenu.
                let endNo = Number(errorItem.slice(errorItem.lastIndexOf("_") + 1, errorItem.length));
                if (errorCat === "connection" || errorCat === "type") {
                    if (endNo === 0) {
                        if (!endState0 || endState0 !== "invalid") {
                            endState0 = this.errors[errorItem][errorCat].errorType;
                        } else if (endState0 === "invalid") {
                            endState0 = this.errors[errorItem][errorCat].errorType;
                        }
                    } else if (endNo === 1) {
                        if (!endState1 || endState1 !== "invalid") {
                            endState1 = this.errors[errorItem][errorCat].errorType;
                        } else if (endState1 === "invalid") {
                            endState1 = this.errors[errorItem][errorCat].errorType;
                        }
                    }
                }
            }
        }

        // Decides what colour the end point dots have depending on the error / mouse.
        for (let endNo of Object.keys(this.connectedNodes)) {
            endNo = Number(endNo);
            let endState = (endNo === 0) ? endState0 : endState1;
            if (endState) {
                switch (endState) {
                    case "invalid":
                        if (this.isSelected) {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ff1919");
                        } else if (this.isFocused) {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ff6666");
                        } else {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ff9999");
                        }
                        break;
                    case "warning":
                        if (this.isSelected) {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ff9f19");
                        } else if (this.isFocused) {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ffbf66");
                        } else {
                            this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#ffdfb2");
                        }
                        break;
                    default:
                        break;
                }
            } else {
                if (this.isSelected) {
                    this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#199fff");
                } else if (this.isFocused) {
                    this.focusDot(this.xCoords[endNo], this.yCoords[endNo], "#66bfff");
                }
            }
        }
    }


    // Gets the distance between two points.
    // Ref: https://stackoverflow.com/questions/15587424/canvas-click-event-on-line
    getLineAngle(p1, p2) {
        let dX = this.xCoords[p2] - this.xCoords[p1];
        let dY = this.yCoords[p2] - this.yCoords[p1];

        return {
            dX: dX,
            dY: dY,
            length: Math.sqrt(dX * dX + dY * dY),
            angle: Math.atan2(dY, dX)
        };
    }

    // Draws the relations on end of Association.
    // Everything here is doubled. Maybe fix that.
    // Ref: https://stackoverflow.com/questions/5068216/placing-text-label-along-a-line-on-a-canvas/5070918#5070918
    // Ref: http://phrogz.net/tmp/canvas_rotated_text.html
    drawRelations() {
        // Gets the extra padding and rotates the texts that are inverted.
        // Probably really bad to have a function do two seperate things, but who's auditing me?
        function invertTextGetPadding(point, attrNo, linkObj) {
            let pad = 0;
            if (point.angle < -Math.PI / 2 || point.angle > Math.PI / 2) {
                // Adds the text length if it's inverted. Not sure why, but 8 needs to be added to put text in the same place as the non inverted text.
                pad = canvasObj.ctx.measureText(linkObj.relatedAttrs[attrNo].relation).width + 8;
                // inverts angle to set text upright.
                point.angle -= Math.PI;
            }
            return pad;
        }

        // Gets the angle and distance between two points.
        let end0 = this.getLineAngle(0, 1);
        let end1 = this.getLineAngle(1, 0);

        // If there's a relation error then set error state.
        // invalid error take priority and are red. Warnings are yellow.
        let endState0 = undefined;
        let endState1 = undefined;
        for (let errorItem of Object.keys(this.errors)) {
            if (this.errors[errorItem]["relation"]) {
                let endNo = Number(errorItem.slice(errorItem.lastIndexOf("_") + 1, errorItem.length));
                if (endNo === 0) {
                    if (!endState0 || endState0 !== "invalid") {
                        endState0 = this.errors[errorItem]["relation"].errorType;
                    } else if (endState0 === "invalid") {
                        endState0 = this.errors[errorItem]["relation"].errorType;
                    }
                } else if (endNo === 1) {
                    if (!endState1 || endState1 !== "invalid") {
                        endState1 = this.errors[errorItem]["relation"].errorType;
                    } else if (endState1 === "invalid") {
                        endState1 = this.errors[errorItem]["relation"].errorType;
                    }
                }
            }
        }

        // Calculates padding based on percetage of padding out of half of the line length.
        let pad0 = ((end0.length / 2) * this.relatedAttrs[0].horzPosPerc) / 100;
        // Gets the padding needed for inverted text. The called function also inverts the text to be upright.
        pad0 += invertTextGetPadding(end0, 0, this);
        // No idea - it was just part of the original formula in the function ref.
        // I almost failed my GCSE Maths. Sorry
        pad0 = pad0 / end0.length * 1;

        // Repeat of above, but for the other end.
        let pad1 = ((end1.length / 2) * this.relatedAttrs[1].horzPosPerc) / 100;
        pad1 += invertTextGetPadding(end1, 1, this);
        pad1 = pad1 / end1.length * 1;

        // Draws the two relation texts.
        canvasObj.ctx.save();
        canvasObj.ctx.textAlign = 'left';
        canvasObj.ctx.font = "14px Arial";
        // If there is a error state for this end then set the color, otherwise use black.
        switch (endState0) {
            case "invalid":
                canvasObj.ctx.fillStyle = "#FF0000";
                break;
            case "warning":
                canvasObj.ctx.fillStyle = "#FF9600";
                break;
            default:
                canvasObj.ctx.fillStyle = "#000000";
                break;
        }
        // Moves the location to end of line + padding.
        canvasObj.ctx.translate(this.xCoords[0] + end0.dX * pad0, this.yCoords[0] + end0.dY * pad0);
        // Rotates the location by the angle of the line.
        canvasObj.ctx.rotate(end0.angle);
        // Last number adjusts the text height from line.
        canvasObj.ctx.fillText(this.relatedAttrs[0].relation, 0, this.relatedAttrs[0].onBottom ? this.lineWidth + 20 : this.lineWidth - 15);
        canvasObj.ctx.restore();

        canvasObj.ctx.save();
        canvasObj.ctx.textAlign = 'left';
        canvasObj.ctx.font = "14px Arial";
        // If there is a error state for this end then set the color, otherwise use black.
        switch (endState1) {
            case "invalid":
                canvasObj.ctx.fillStyle = "#FF0000";
                break;
            case "warning":
                canvasObj.ctx.fillStyle = "#FF9600";
                break;
            default:
                canvasObj.ctx.fillStyle = "#0000000";
                break;
        }
        // Moves the location to end of line + padding.
        canvasObj.ctx.translate(this.xCoords[1] + end1.dX * pad1, this.yCoords[1] + end1.dY * pad1);
        // Rotates the location by the angle of the line.
        canvasObj.ctx.rotate(end1.angle);
        // Last number adjusts the text height from line.
        canvasObj.ctx.fillText(this.relatedAttrs[1].relation, 0, this.relatedAttrs[1].onBottom ? this.lineWidth + 20 : this.lineWidth - 15);
        canvasObj.ctx.restore();
    }

    // Draws the Association and all it's other components.
    draw() {
        this.drawRelations();
        this.drawBorder();
        this.drawLine();
    }

    // Looks for a node and it's attributes to anchor to.
    findAnchor() {
        // Holds the node information obtained from hit detection.
        let nodeObjTemp;
        let nodeObjTempAttrID;
        // Holds the array ref of the the resizing point.
        let xCoord = this.xCoords[this.resizeXIndex];
        let yCoord = this.yCoords[this.resizeYIndex];

        // Looks for a hit on a node and then if there is a hit on an attribute.
        for (let nodeObj of canvasObj.graphObj.nodes) {
            if (nodeObj.returnHit(xCoord, yCoord)) {
                nodeObjTempAttrID = nodeObj.returnAttrHit(xCoord, yCoord);
                if (nodeObjTempAttrID)
                    nodeObjTemp = nodeObj;
            }
        }

        // Checks if resizing points are the same.
        // Checks if resizeXIndex is either 0 or 1 (either end).
        // If there is a nodeObj then remove the node from the current resizing end and add the hit node, otherwise remove the connected node.
        // If the node IDs were added to the end then attach to an anchor, otherwise remove the node.
        if (this.resizeXIndex === this.resizeYIndex) {
            if (this.resizeXIndex === 0 || this.resizeXIndex === 1) {
                if (nodeObjTemp) {
                    this.removeNode(this.resizeXIndex);
                    this.addNode(nodeObjTemp, nodeObjTempAttrID, this.resizeXIndex);
                    // Precautionary - stops redundant data being left behind.
                    if (this.connectedNodes[this.resizeXIndex].id) {
                        this.attachToAnchor(nodeObjTemp, this.resizeXIndex);
                    } else {
                        this.removeNode(this.resizeXIndex);
                    }
                } else {
                    this.removeNode(this.resizeXIndex);
                }
                // Checks the validity of self.
                canvasObj.graphObj.updateThisAssociationErrors(this);
            }
        }
    }

    // Moves the given end to the node that was found by findAnchor.
    attachToAnchor(nodeObj, end) {
        if (end === 0 || end === 1) {
            // Holds the node component and the coordinates of anchor point.
            let box = undefined;
            let anchorX = 0;
            let anchorY = 0;


            // Moves thel given end to the correct side of the node.
            // Gets the attribute type box for left connections and the attribute box for right connections.
            if (this.findAnchorSide(end) === "right") {
                box = nodeObj.getAttrBox(this.relatedAttrs[end].attrID);
                anchorX = box.x + box.w - nodeObj.attrRowTypeWidth;
                anchorY = box.y + (box.h / 2);
            } else {
                box = nodeObj.getTypeBox(this.relatedAttrs[end].attrID);
                anchorX = box.x;
                anchorY = box.y + (box.h / 2);
            }
            // sets the given end coordinates to the coordinates calculated.
            this.xCoords[end] = anchorX;
            this.yCoords[end] = anchorY;
        } else {
            console.log("invalid end provided to: attachToAnchor()");
        }
    }

    // Returns "left" or "right" depending on which side the given link end is connected on the node.
    findAnchorSide(end) {
        if (end === 0 || end === 1) {
            // Holds the node information.
            let nodeObj = undefined;
            let midPoint = 0;

            // Find the node that the end is connected to.
            if (this.connectedNodes[end].id) {
                nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[end].id);
            } else {
                console.log("Chosen end: " + end + " has no node attached");
            }

            // If the end X of the end is more than the mid point of node then its on the right, otherwise its on the left.
            if (nodeObj) {
                midPoint = nodeObj.startX + (nodeObj.width / 2);
                if (this.xCoords[end] > midPoint) {
                    return "right";
                } else {
                    return "left";
                }
            }
        } else {
            console.log("Invalid end provided to: findAnchorSide()");
        }
    }

    // Overrides the super function to add linking to attr instead of whole node.
    // DOES NOT CURRENTLY ALLOW FOR RECURSIVE.
    addNode(nodeObj, attrID, end) {
        if (end === 0 || end === 1) {
            // Checks if there's a matching connected node already.
            let match = false;
            for (let nodeNo of Object.keys(this.connectedNodes)) {
                if (this.connectedNodes[nodeNo].id === nodeObj.id) match = true;
            }

            if (!match) {
                this.connectedNodes[end].id = nodeObj.id;
                this.relatedAttrs[end].attrID = attrID;
                nodeObj.addLink(this.id);
            }
            // Checks the validity of the affected node
            canvasObj.graphObj.updateLinkNodeErrors(this);
            canvasObj.graphObj.updateThisAssociationErrors(this);
        }
    }

    // Overrides the super function to remove the attr vars as well.
    removeNode(end) {
        if (end === 0 || end === 1) {
            if (this.connectedNodes[end].id) {
                let nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[end].id);
                if (nodeObj) nodeObj.removeLink(this.id);
                this.connectedNodes[end].id = undefined
                this.relatedAttrs[end].attrID = undefined;

                // Check the validity of the removed node.
                if (nodeObj) canvasObj.graphObj.updateThisNodeErrors(nodeObj);
                canvasObj.graphObj.updateThisAssociationErrors(this);
            }
        }
    }

    // Checks if the coordinates given are within the line.
    returnHit(mX, mY) {
        let hit = false;
        let lineAngle = this.getLineAngle(0, 1);

        // Draws a box that is the length of the line and slightly wider to make it a easier hit.
        // Ref: https://stackoverflow.com/questions/15587424/canvas-click-event-on-line
        canvasObj.ctx.save();
        canvasObj.ctx.beginPath();
        canvasObj.ctx.translate(this.xCoords[0], this.yCoords[0]);
        canvasObj.ctx.rotate(lineAngle.angle);
        canvasObj.ctx.rect(0, -this.lineWidth - 4, lineAngle.length, this.lineWidth + 10);
        canvasObj.ctx.translate(-this.xCoords[0], -this.yCoords[0]);
        canvasObj.ctx.rotate(-lineAngle.angle);
        canvasObj.ctx.restore();

        if (canvasObj.ctx.isPointInPath(mX, mY)) {
            hit = true;
        }
        return hit;
    }

    // check if coordinates are within the links resizing dots and sets resizing coordinates if true.
    returnResizeHit(mX, mY) {
        var hit = false;
        for (let i = this.xCoords.length; i >= 0; i--) {
            this.focusDot(this.xCoords[i], this.yCoords[i]);
            if (canvasObj.ctx.isPointInPath(mX, mY)) {
                // Stops the resizing points from changing if the current resizing point is dragged over another.
                if (!this.isResizing) {
                    this.resizeXIndex = i;
                    this.resizeYIndex = i;
                }
                hit = true;
            }
        }
        // Lazy fix to get rid of black focus dots generated. Fix later if have time.
        canvasObj.draw();
        return hit;
    }

    // Returns or creates a new PropertyMenu object for this object.
    getPropMenu() {
        if (!this.propMenu) {
            this.propMenu = new AssociationMenu(this)
            return this.propMenu;
        } else {
            return this.propMenu;
        }
    }
};
