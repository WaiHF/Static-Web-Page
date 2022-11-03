class Node {
    constructor(id, startX, startY) {
        this.id = id;
        this.startX = startX;
        this.startY = startY;
        this.isDragging = false;
        this.isSelected = false;
        this.isFocused = false;
        this.isResizing = false;
        // Holds the connected link IDs.
        this.connectedLinks = [];
        this.errors = {};
    }

    // Sets the id for the node.
    setID(id) {
        this.id = id;
        return this;
    }

    // Checks if coordinates are within the drawn node.
    returnHit(mX, mY) {
        var hit = false;
        this.draw();
        if (canvasObj.ctx.isPointInPath(mX, mY)) hit = true;
        return hit;
    }

    // Moves the node by distance provided.
    moveTo(dX, dY, groupMove) {
        // Updates the top left coordinates.
        this.startX += parseInt(dX);
        this.startY += parseInt(dY);
        // Updates connected link end coordinates.
        for (let linkID of this.connectedLinks) {
            let linkObj = canvasObj.graphObj.links.find(linkObj => linkObj.id === linkID);
            linkObj.movePoint(dX, dY, this.id);
        }
    }

    // Adds the given link ID to the connectedLinks array.
    addLink(linkID) {
        if (!this.connectedLinks.includes(linkID)) this.connectedLinks.push(linkID);
    }

    // Removes one matching link from the connectedLinks array.
    removeLink(linkID) {
        const linkI = this.connectedLinks.indexOf(linkID);
        if (linkI >= 0) this.connectedLinks.splice(linkI, 1);
    }

    // Used to draw filled dots.
    focusDot(x, y, color) {
        canvasObj.ctx.save();
        canvasObj.ctx.beginPath();
        canvasObj.ctx.arc(x, y, 7, 0, 2 * Math.PI);
        canvasObj.ctx.closePath();
        if (color) {
            canvasObj.ctx.fillStyle = color;
        } else {
            canvasObj.ctx.fillStyle = "#000000";
        }
        canvasObj.ctx.fill();
        canvasObj.ctx.restore();
    }

};
class RelationTable extends Node {
    constructor(id, startX, startY, width, height) {
        super(id, startX, startY);
        // Relation Table specific vars.
        this.title = {
            name: "Table_" + canvasObj.graphObj.nodes.length,
        };
        this.attributes = [
            {
                id: new Date().valueOf() + 1,
                type: "PK",
                name: "primary_key",
            },
            {
                id: new Date().valueOf() + 2,
                type: "AT",
                name: "attribute_1",
            }
        ];
        this.propMenu = undefined;

        // UI specific vars.
        this.lineWidth = 2;
        this.lineColor = "#000000";
        this.textColor = "#000000";
        this.attrRowHeight = 30;
        this.attrRowTypeWidth = 40;
        this.width = width;
        this.height = height;
        this.titleHeight = 40;

        // Sets the table's width with new minimum length.
        this.setWidth(this.returnMinimumWidth());
    }

    //Sets the table's width.
    setWidth(width) {
        // Calculates the distance moved from last width.
        let dX = parseInt(this.width - width);
        // Find's all connected links and moves the ends that are connected on the right side.
        for (let linkID of this.connectedLinks) {
            let linkObj = canvasObj.graphObj.links.find(linkObj => linkObj.id === linkID);
            // Not sure why the distance needs to be inverted to go in the right direction.
            for (let nodeNo of Object.keys(linkObj.connectedNodes)) {
                if (linkObj.connectedNodes[nodeNo].id === this.id && linkObj.findAnchorSide(Number(nodeNo)) === "right") {
                    linkObj.movePoint(-dX, 0, this.id);
                }
            }
        }

        this.width = width;
    }

    // Sets the table's title.
    setTitle(title) {
        this.title.name = title;
        // Sets the table's width with new minimum length.
        this.setWidth(this.returnMinimumWidth());

        // Validates its own title with other tables.
        canvasObj.graphObj.updateOtherNodesErrors(this.refObj);
    }

    // Sets the attribute type of a attribute based on the index given.
    setAttributeType(attrID, type) {
        //Gets the attribute by id.
        let attrObj = this.attributes.find(attrObj => attrObj.id === attrID);
        // Changes attribute type.
        attrObj.type = type;
        // Runs validation for affected associations.
        // Gets all the link IDs connected to the affected attribute.
        let linkList = this.getLinksToUpdate(attrObj.id);
        // Loops through link IDs retrieving each link object from ID and runs validation for each.
        for (let linkNo of Object.keys(linkList)) {
            canvasObj.graphObj.updateThisAssociationErrors(canvasObj.graphObj.links.find(linkObj => linkObj.id === linkList[linkNo].id))
        }

        // Validates errors for itself.
        canvasObj.graphObj.updateThisNodeErrors(this);
    }

    // Sets the attribute name of a attribute based on the index given.
    setAttributeName(attrID, name) {
        //Gets the attribute by id.
        let attrObj = this.attributes.find(attrObj => attrObj.id === attrID);
        // Changes the attributes name.
        attrObj.name = name;
        // Sets the table's width with new minimum length.
        this.setWidth(this.returnMinimumWidth());

        // Validates errors for itself.
        canvasObj.graphObj.updateThisNodeErrors(this);
    }

    // Deletes a attribute in the attributes array based on the index given.
    delAttribute(attrID) {
        //Gets the attribute by id.
        let attrObj = this.attributes.find(attrObj => attrObj.id === attrID);
        // Gets the attribute index.
        let attrNo = this.attributes.indexOf(attrObj);

        // Gets the links attached to the affected attribute and removes their connection to the node.
        if (this.connectedLinks.length > 0) {
            let attrLinks = this.getLinksToUpdate(attrObj.id);
            for (let link of attrLinks) {
                canvasObj.graphObj.links.find(linkObj => linkObj.id === link.id).removeNode(link.end);
            }
        }

        // Removes all errors related to the attribute.
        delete this.errors["attr_" + attrObj.id];

        // Removes the attribute from the attributes array.
        this.attributes.splice(attrNo, 1);

        // Sets the table's width with new minimum length.
        this.setWidth(this.returnMinimumWidth());

        // Validates errors for itself.
        canvasObj.graphObj.updateThisNodeErrors(this);
    }

    // Adds a default attribute to the attributes array.
    addAttribute() {
        this.attributes.push({
            id: new Date().valueOf(),
            type: "AT",
            name: "new_attribute_" + this.attributes.length,
            status: ""
        });
        // Sets the table's width with new minimum length.
        this.setWidth(this.returnMinimumWidth());

        // Validates errors for itself.
        canvasObj.graphObj.updateThisNodeErrors(this);
    }


    // Swaps the attributes in the attributes array when given a origin and target index.
    swapAttributes(originAttrID, targetAttrID) {
        // Gets both attributes from id.
        let originAttrTemp = this.attributes.find(attrObj => attrObj.id === originAttrID);
        let originIndex = this.attributes.indexOf(originAttrTemp);
        let targetAttrTemp = this.attributes.find(attrObj => attrObj.id === targetAttrID);
        let targetIndex = this.attributes.indexOf(targetAttrTemp);


        this.attributes.splice(targetIndex, 1, originAttrTemp);
        this.attributes.splice(originIndex, 1, targetAttrTemp);


        // Finds new anchor points for the links attached to that attributes that were moved.
        if (this.connectedLinks.length > 0) {
            let originAttrLinks = this.getLinksToUpdate(originAttrTemp.id);
            for (let link of originAttrLinks) {
                canvasObj.graphObj.links.find(linkObj => linkObj.id === link.id).attachToAnchor(this, link.end);
            }

            let targetAttrLinks = this.getLinksToUpdate(targetAttrTemp.id);
            for (let link of targetAttrLinks) {
                canvasObj.graphObj.links.find(linkObj => linkObj.id === link.id).attachToAnchor(this, link.end);
            }
        }
    }

    // Gets a list of connected links that need their attribute data updated with a change in the attribute data.
    getLinksToUpdate(attrID) {
        let attrLinks = [];

        for (let linkNo of this.connectedLinks) {
            let linkObj = canvasObj.graphObj.links.find(linkObj => linkObj.id === linkNo);
            for (let i in Object.keys(linkObj.relatedAttrs)) {
                if (linkObj.relatedAttrs[i].attrID === attrID && attrID) {
                    attrLinks.push({
                        id: linkObj.id,
                        end: Number(i)
                    });
                }
            }
        }

        return attrLinks;
    }

    // Called when node needs to be saved.
    saveFormat() {
        // General attributes resets.
        this.isDragging = false;
        this.isSelected = false;
        this.isFocused = false;
        this.isResizing = false;

        // Property menu related resets.
        if (this.propMenu) {
            this.propMenu.closeMenu();
            this.propMenu = undefined;
        }
    }

    // Called when node needs to be deleted.
    deleteFormat() {
        // Need to create a temp array to store the link IDs as linkObj.removeNode changes the connectedLinks array.
        let connectedLinksTemp = [...this.connectedLinks];

        // Removes all associations of the table before removing from array.
        for (let linkID of connectedLinksTemp) {
            let linkObj = canvasObj.graphObj.links.find(linkObj => linkObj.id === linkID);
            for (let nodeNo of Object.keys(linkObj.connectedNodes)) {
                if (linkObj.connectedNodes[nodeNo].id === this.id) linkObj.removeNode(Number(nodeNo));
            }
        }

        // Property menu related closes.
        if (this.propMenu === canvasObj.propMenu) {
            this.propMenu.closeMenu();
        }
    }

    // Update the error objects every time with the result from a validation function in Graph.
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

    drawBorder() {
        // updates the table size so the appropriate size box can be drawn.
        this.height = this.titleHeight + (this.attrRowHeight * (this.attributes.length + 1));

        function selectionBorder(obj, color) {
            // Draws the selection border.
            canvasObj.ctx.save();
            canvasObj.ctx.lineWidth = 1;
            canvasObj.ctx.strokeStyle = color;
            canvasObj.ctx.beginPath();
            canvasObj.ctx.rect(obj.startX - 15, obj.startY - 15, obj.width + 30, obj.height + 30);
            canvasObj.ctx.closePath();
            canvasObj.ctx.stroke();
            canvasObj.ctx.restore();

            // Draws the top dot.
            obj.focusDot((obj.startX - 15) + ((obj.width + 30) / 2), (obj.startY - 15), color);
            // Draws the right dot.
            obj.focusDot((obj.startX - 15) + (obj.width + 30), (obj.startY - 15) + ((obj.height + 30) / 2), color);
            // Draws the bottom dot.
            obj.focusDot((obj.startX - 15) + ((obj.width + 30) / 2), (obj.startY - 15) + (obj.height + 30), color);
            // Draws the left dot.
            obj.focusDot(obj.startX - 15, obj.startY - 15 + ((obj.height + 30) / 2), color);
        }
        // draws a sets of focus dots depending on whether the node is moused over, or selected.
        if (this.isSelected) {
            selectionBorder(this, "#199fff");
        } else if (this.isFocused) {
            selectionBorder(this, "#66bfff");
        }

        // Draws the table sides.
        canvasObj.ctx.save();
        canvasObj.ctx.lineWidth = this.lineWidth;
        canvasObj.ctx.strokeStyle = this.lineColor;
        let errorState = undefined;
        for (let errorItem of Object.keys(this.errors)) {
            for (let errorCat of Object.keys(this.errors[errorItem])) {
                if (!errorState || errorState !== "invalid") {
                    errorState = this.errors[errorItem][errorCat].errorType;
                } else if (errorState === "invalid") {
                    errorState = this.errors[errorItem][errorCat].errorType;
                }
            }
        }

        // Adds shadows the to border if there is an error.
        switch (errorState) {
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

        canvasObj.ctx.fillStyle = "#F1F6FC";
        canvasObj.ctx.beginPath();
        canvasObj.ctx.rect(this.startX, this.startY, this.width, this.height);
        canvasObj.ctx.closePath();
        canvasObj.ctx.fill();
        canvasObj.ctx.stroke();
        canvasObj.ctx.restore();
    }

    // Draws the title.
    drawTitle() {
        // Draws the title box.
        canvasObj.ctx.save();
        canvasObj.ctx.lineWidth = this.lineWidth;

        canvasObj.ctx.beginPath();
        canvasObj.ctx.rect(this.startX, this.startY, this.width, this.titleHeight);
        canvasObj.ctx.closePath();
        canvasObj.ctx.stroke();
        canvasObj.ctx.restore();

        // Draws the title text.
        canvasObj.ctx.save();
        canvasObj.ctx.fillStyle = this.textColor;
        if (this.errors.hasOwnProperty("table")) {
            if (this.errors["table"].hasOwnProperty("name")) {
                if (this.errors["table"]["name"].errorType === "invalid") {
                    canvasObj.ctx.fillStyle = "#FF0000";
                }
            }
        }
        canvasObj.ctx.textAlign = "center";
        canvasObj.ctx.font = "bold 20px Arial";
        canvasObj.ctx.fillText(this.title.name, this.startX + this.width / 2, this.startY + 25);
        canvasObj.ctx.restore();
    }

    // Draws the attributes.
    drawAttributes() {
        // Defines the
        let totalYOffset = this.titleHeight;
        let typeBoxX = this.startX;
        let typeBoxWidth = this.attrRowTypeWidth;
        let typeBoxHeight = this.attrRowHeight;
        let attrBoxX = this.startX + this.attrRowTypeWidth;
        let attrBoxWidth = this.width - typeBoxWidth;
        let attrBoxHeight = this.attrRowHeight;

        for (let attrObj of this.attributes) {
            let typeBoxY = this.startY + totalYOffset;
            let attrBoxY = this.startY + totalYOffset;

            // Draws the box for key value.
            // Also sets the line width and color for the boxes.
            canvasObj.ctx.save();
            canvasObj.ctx.lineWidth = this.lineWidth;
            canvasObj.ctx.strokeStyle = this.lineColor;
            canvasObj.ctx.beginPath();
            canvasObj.ctx.rect(typeBoxX, typeBoxY, typeBoxWidth, typeBoxHeight);
            canvasObj.ctx.closePath();
            canvasObj.ctx.stroke();
            canvasObj.ctx.restore();

            // Draws the key value into key box.
            canvasObj.ctx.save();
            canvasObj.ctx.fillStyle = this.textColor;
            if (this.errors.hasOwnProperty("attr_" + attrObj.id)) {
                if (this.errors["attr_" + attrObj.id].hasOwnProperty("type")) {
                    if (this.errors["attr_" + attrObj.id]["type"].errorType === "invalid") {
                        canvasObj.ctx.fillStyle = "#FF0000";
                    }
                }
            }
            canvasObj.ctx.textAlign = "center";
            canvasObj.ctx.font = "bold 12px Arial";
            canvasObj.ctx.fillText(attrObj.type, typeBoxX + (this.attrRowTypeWidth / 2), typeBoxY + (this.attrRowHeight / 1.5));
            canvasObj.ctx.restore();

            // Draws the box for attribute.
            canvasObj.ctx.save();
            canvasObj.ctx.lineWidth = this.lineWidth;
            canvasObj.ctx.strokeStyle = this.lineColor;
            canvasObj.ctx.beginPath();
            canvasObj.ctx.rect(attrBoxX, attrBoxY, attrBoxWidth, attrBoxHeight);
            canvasObj.ctx.closePath();
            canvasObj.ctx.stroke();
            canvasObj.ctx.restore();

            // Draws the attribute into the attribute box.
            canvasObj.ctx.save();
            canvasObj.ctx.fillStyle = this.textColor;
            if (this.errors.hasOwnProperty("attr_" + attrObj.id)) {
                if (this.errors["attr_" + attrObj.id].hasOwnProperty("name")) {
                    if (this.errors["attr_" + attrObj.id]["name"].errorType === "invalid") {
                        canvasObj.ctx.fillStyle = "#FF0000";
                    }
                }
            }
            canvasObj.ctx.textAlign = "left";
            canvasObj.ctx.font = "12px Arial";
            canvasObj.ctx.fillText(attrObj.name, attrBoxX + 5, attrBoxY + 20);
            canvasObj.ctx.restore();

            // Adds to the totalYOffset to begin drawing on next row down.
            totalYOffset += this.attrRowHeight;
        }

        let addButtonX = this.startX;
        let addButtonY = this.startY + totalYOffset;

        // Draws the box and text for the "add" attribute box.
        canvasObj.ctx.save();
        canvasObj.ctx.lineWidth = this.lineWidth;
        canvasObj.ctx.strokeStyle = this.lineColor;
        canvasObj.ctx.beginPath();
        canvasObj.ctx.rect(addButtonX, addButtonY, this.attrRowTypeWidth, this.attrRowHeight);
        canvasObj.ctx.closePath();
        canvasObj.ctx.stroke();
        canvasObj.ctx.textAlign = "center";
        canvasObj.ctx.font = "bold 16px Arial";
        canvasObj.ctx.fillText("+", addButtonX + 20, addButtonY + 20);
        canvasObj.ctx.restore();

        // Changes table size depending on how many attributes there are.
        this.height = totalYOffset + this.attrRowHeight;
    }

    // Draws the entire table.
    draw() {
        this.drawBorder();
        this.drawTitle();
        this.drawAttributes();
    }

    // Returns the title's box coordinates.
    getTitleBox() {
        return {
            x: this.startX,
            y: this.startY,
            w: this.width,
            h: this.titleHeight
        };
    }

    // returns the given attribute's type box coordinates.
    getTypeBox(attrID) {
        let totalYOffset = this.titleHeight;
        let typeBoxesX = this.startX;
        let typeBoxWidth = this.attrRowTypeWidth;
        let typeBoxHeight = this.attrRowHeight;

        for (let attrObj of this.attributes) {
            let typeBoxesY = this.startY + totalYOffset;

            if (attrObj.id === attrID) {
                return {
                    x: typeBoxesX,
                    y: typeBoxesY,
                    w: typeBoxWidth,
                    h: typeBoxHeight
                };
            }

            totalYOffset += this.attrRowHeight;
        }
    }

    // Returns the given attribute's box coordinates.
    getAttrBox(attrID) {
        let totalYOffset = this.titleHeight;
        let attrBoxX = this.startX + this.attrRowTypeWidth;
        let attrBoxWidth = this.width;
        let attrBoxHeight = this.attrRowHeight;

        for (let attrObj of this.attributes) {
            let attrBoxY = this.startY + totalYOffset;

            if (attrObj.id === attrID) {
                return {
                    x: attrBoxX,
                    y: attrBoxY,
                    w: attrBoxWidth,
                    h: attrBoxHeight
                };
            }

            totalYOffset += this.attrRowHeight;
        }
    }

    // Checks if coordinates are within the drawn node without having to redraw.
    returnHit(mX, mY) {
        canvasObj.ctx.beginPath();
        canvasObj.ctx.rect(this.startX, this.startY, this.width, this.height);
        canvasObj.ctx.closePath();
        return canvasObj.ctx.isPointInPath(mX, mY);
    }


    // Checks if the coordinates are within a attribute box and returns the attribute ID if they are in.
    returnAttrHit(mX, mY) {
        let totalYOffset = this.titleHeight;
        let attrBoxesX = this.startX;
        let attrBoxesWidth = this.width;
        let attrBoxesHeight = this.attrRowHeight;

        // Create each attribute row and check if the point is within one of those boxes.
        for (let attrObj of this.attributes) {
            let attrBoxesY = this.startY + totalYOffset;

            // Sets the attribute box's location.
            canvasObj.ctx.beginPath();
            canvasObj.ctx.rect(attrBoxesX, attrBoxesY, attrBoxesWidth, attrBoxesHeight);
            canvasObj.ctx.closePath();

            // If the box is hit return the attribute id.
            if (canvasObj.ctx.isPointInPath(mX, mY)) return attrObj.id;

            // Increase totalYOffset for next attribute in the list.
            totalYOffset += this.attrRowHeight;
        }
    }

    // Returns the largest width of either the title, or longest attribute.
    returnMinimumWidth() {
        // Sets the title font, and gets its length + padding.
        canvasObj.ctx.font = "bold 20px Arial";
        let titleLength = canvasObj.ctx.measureText(this.title.name).width + 10;
        // Sets the attribute's font.
        canvasObj.ctx.font = "12px Arial";
        let attrLength = 0;

        // Gets the longest attributes name length + 3 line widths + padding and sets it into attrLength.
        for (let attrObj of this.attributes) {
            let tempLength = canvasObj.ctx.measureText(attrObj.name).width + this.attrRowTypeWidth + (this.lineWidth * 3) + 10;
            if (tempLength > attrLength) attrLength = tempLength;
        }

        // Returns titleLength if it's longest, otherwise return the attrLength.
        return (titleLength > attrLength) ? titleLength : attrLength;
    }

    // WIP.
    returnResizeHit(mX, mY) {
        return false;
    }

    // WIP.
    resize(dX, dY) {
        return false;
    }

    // Returns or creates a new PropertyMenu object for this object.
    getPropMenu() {
        if (!this.propMenu) {
            this.propMenu = new RelationTableMenu(this)
            return this.propMenu;
        } else {
            return this.propMenu;
        }
    }
};
