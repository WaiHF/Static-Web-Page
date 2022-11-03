class Graph {
    constructor() {
        this.links = [];
        this.nodes = [];
    }

    addLink(linkObj) {
        if (!this.links.includes(linkObj)) {
            this.links.push(linkObj);
        }
    }

    addNode(nodeObj) {
        if (!this.nodes.includes(nodeObj)) {
            this.nodes.push(nodeObj);
        }
    }

    saveGraph = e => {
        let saveData = "";

        // Creates the filename input.
        function downloadFile(graphType) {
            return new Promise(resolve => {
                let filename = "";
                while (filename === "") {
                    filename = prompt("Enter a filename:", graphType);
                }
                if (filename != null) {
                    resolve(filename);
                }
            });
        }

        // Creates a string of nodes and links that can be put into a JSON file.
        saveData = '{"' + this.constructor.name + '":{';
        saveData += '"links":[';
        for (let i = 0; i < this.links.length; i++) {
            // Calls the function that resets some non essential vars for save.
            this.links[i].saveFormat();
            saveData += '{"' + this.links[i].constructor.name + '":' + JSON.stringify(this.links[i]);
            if (i != this.links.length - 1) {
                saveData += "},";
            } else {
                saveData += "}";
            }
        }
        saveData += "],";
        saveData += '"nodes":[';
        for (let i = 0; i < this.nodes.length; i++) {
            // Calls the function that resets some non essential vars for save.
            this.nodes[i].saveFormat();
            saveData += '{"' + this.nodes[i].constructor.name + '":' + JSON.stringify(this.nodes[i]);
            if (i != this.nodes.length - 1) {
                saveData += "},";
            } else {
                saveData += "}";
            }
        }
        saveData += "]";
        saveData += "}}";

        // if a valid name is provided then continue to create the download.
        downloadFile(this.constructor.name).then(filename => {
            // Create the download link and executes it. Ref: https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
            const download = document.createElement("a");
            download.href = "data:application/octet-stream," + encodeURIComponent(saveData);
            download.download = filename += ".json";
            download.click();
        });
    }

    loadGraph = e => {
        let blankGraph = false;

        // Creates the file input window and tries to parse file contents as JSON. Ref: https://stackoverflow.com/questions/19038919/is-it-possible-to-upload-a-text-file-to-input-in-html-js
        function uploadFile() {
            return new Promise((resolve, reject) => {
                // create file input box.
                const upload = document.createElement("input");
                upload.type = "file";
                upload.style.display = "none";
                upload.click();

                // listen for files
                upload.addEventListener("change", () => {
                    const files = upload.files;
                    if (files.length) {
                        const reader = new FileReader();
                        reader.readAsText(files[0]);
                        reader.addEventListener("load", () => {
                            try {
                                resolve(JSON.parse(reader.result));
                            } catch (error) {
                                reject(error);
                            }
                        });
                    }
                });
            });
        }

        // Starts populating the links and nodes array if JSON is parse successfully.
        uploadFile().then(loadData => {
            // Will prompt user if graph contains one object to cofirm the overwrite.
            if (this.links.length > 0 || this.nodes.length > 0) {
                if (confirm("Loading will clear the canvas.")) {
                    this.clearGraph(e, true);
                    blankGraph = true;
                } else {
                    blankGraph = false;
                }
            } else {
                blankGraph = true;
            }

            // Clears the graph.
            if (blankGraph) {
                // Loads all the objects from the save file.
                for (let graphType in loadData) {
                    if (graphType != canvasObj.graphObj.constructor.name) {
                        alert("Save file contains the wrong graph type");
                        break;
                    }
                    for (let arrayType in loadData[graphType]) {
                        for (let index of loadData[graphType][arrayType]) {
                            for (let obj in index) {
                                // Some dark magic to get the correct constructor from a string. Not sure how it works apart from the fact that "Function" gets to the global scope, but "this" or "window" does not.
                                // Ref: https://stackoverflow.com/questions/1366127/how-do-i-make-javascript-object-using-a-variable-string-to-define-the-class-name
                                this[arrayType].push(Object.assign((Function('return new ' + obj))(), index[obj]));
                            }
                            canvasObj.draw();
                        }
                    }
                }
            }
        }).catch(error => {
            // Clears the graph if the load fails.
            this.clearGraph(e, true);
            console.log("failed to parse JSON: " + e);
            alert("Unable to load the selected file.");
        });
    }

    // Clears the graph of all objects.
    clearGraph = (e, overwrite) => {
        function removeFromArr(graphObj, objArray) {
            // Spread operator used to clone the objArray for deletion. Ref: https://www.freecodecamp.org/news/how-to-clone-an-array-in-javascript-1d3183468f6a/
            let tempArr = [...objArray];

            // Loops through tempArr and calls graphs removeObj function if it has one.
            for (let obj of tempArr) {
                try {
                    graphObj.removeObj(obj);
                } catch (e) {
                    console.log("Cannot remove Object: " + e);
                }
            }
        }

        // If overwrite is given and is true then proceed to delete graph objects.
        // If overwrite is not given then promt user for delete.
        if (overwrite) {
            removeFromArr(this, this.links);
            removeFromArr(this, this.nodes);
        } else if (overwrite === undefined) {
            if (confirm("Erase the canvas?")) {
                removeFromArr(this, this.links);
                removeFromArr(this, this.nodes);
            }
        }
        canvasObj.draw();
    }

    // Creates a save copy of all the objects that were passed.
    copyObjs(os) {
        // Holds the JSON array of copied objects.
        let saveData = "[";

        // Goes through all the working Objects
        for (let o of os) {
            // Clones object.
            let tempO = Object.assign(new o.constructor(), o);

            // Formats the clone to be saved.
            tempO.saveFormat();

            // MAYBE THE SAVE FILE SHOULD BE LIKE THIS INSTEAD.

            // Start of save record for entity.
            // Gets the class of the entity.
            saveData += '{"class":"' + tempO.constructor.name + '"';
            //  Gets the array that the object is located in. NOT NEEDED IF THE NODES AND LINKS WERE NOT STORED IN TWO SEPERATE ARRAYS. WHO'S STUPID IDEA WAS THAT?
            saveData += ',"type":' + (this.links.includes(o) ? '"links"' : '"nodes"');
            // Gets the data of the entity.
            saveData += ',"data":' + JSON.stringify(tempO);
            // If it is not the last object in the array then add a comma after the entry.
            if (os[os.length - 1] === o) {
                saveData += "}";
            } else {
                saveData += "},";
            }
        }
        saveData += "]";

        return saveData;
    }

    pasteObjs(os) {
        function getNewID(graphObj, offset) {
            // Creates the newID with the addition of offset. Maybe a randon number should be used instead?
            let newID = Date.now() + offset;

            // Generates a new ID from current date. This limits the speed of the process?
            // Checks all arrays - temp and working to prevent duplicate IDs.
            while (graphObj.links.find(o => o.id === newID) || graphObj.nodes.find(o => o.id === newID) || tempLinks.find(o => o.id === newID) || tempNodes.find(o => o.id === newID)) {
                // If there's a match then get a new id with an increased offset.
                newID = getNewID(graphObj, offset++);
            }

            // returns the generated ID.
            return newID;
        }

        // Arrays used to hold the loaded objects temporarily.
        let tempLinks = [];
        let tempNodes = [];

        // Fills the temp arrays with their corresponding objects to be worked on outside of the working arrays.
        for (let o of os) {
            if (o["type"] === "links") {
                tempLinks.push(Object.assign((Function('return new ' + o["class"]))(), o["data"]));
            } else {
                tempNodes.push(Object.assign((Function('return new ' + o["class"]))(), o["data"]));
            }
        }

        // Sets new IDs for links and performs a variety of other maintenance tasks.
        for (let linkObj of tempLinks) {
            const oldID = linkObj.id;
            let newID = getNewID(this, 0);

            // For both ends of the link.
            for (let end of Object.keys(linkObj.connectedNodes)) {

                if (linkObj.connectedNodes[end].id) {
                    // If the current end has a Node ID.
                    // Try to find the connected Node in the Node temp array.
                    let nodeObj = tempNodes.find(o => o.id === linkObj.connectedNodes[end].id);

                    if (nodeObj) {
                        // If the connected Node is found in the temp array.
                        // Gets the connected Node's connected attribute ID.
                        let connAttrID = linkObj.relatedAttrs[end].attrID;

                        // ORDER MATTERS HERE.
                        // Sets a new ID for the Link.
                        linkObj.setID(newID);
                        // Remove the current connected Node.
                        linkObj.removeNode(parseInt(end));
                        // Removes the old link ID from the disconnected Node, as the call to removeNode above would have provided the new link ID which the node does not have.
                        nodeObj.removeLink(oldID);
                        // Reconnects the recently disconnected Node.
                        linkObj.addNode(nodeObj, connAttrID, parseInt(end));
                        // Attempts to push to the working array.
                        this.addLink(linkObj);
                    } else {
                        // If the connected Node is not found in the temp array.
                        // ORDER MATTERS HERE.
                        // Sets a new ID for the Link.
                        linkObj.setID(newID);
                        // Removes the old connected node from the Link.
                        linkObj.removeNode(parseInt(end));
                        // Attempts to push to the working array.
                        this.addLink(linkObj);
                    }
                }
            }

            // Run in case link is not connected to any nodes.
            // Sets a new ID for the Link.
            linkObj.setID(newID);
            // Attempts to push to the working array.
            this.addLink(linkObj);
        }

        // Sets new IDs for nodes and performs a variety of other maintenance tasks.
        for (let nodeObj of tempNodes) {
            const oldID = nodeObj.id;
            let newID = getNewID(this, 0);
            // Temp array, as connected links will be changed. May have wasted hours again wondering why results were so inconsistent. When will I learn?
            const connLinks = [...nodeObj.connectedLinks];

            if (connLinks.length > 0) {
                // If the current node has links connected to it.
                // For each Link connected to the node.
                for (let linkID of connLinks) {
                    // Try to find the connected Link in the working array, as the updated links are now there.
                    let linkObj = tempLinks.find(o => o.id === linkID);

                    if (linkObj) {
                        // If the connected Link is found in the working array.
                        // For each end of the found connected Link.
                        for (let end of Object.keys(linkObj.connectedNodes)) {
                            if (linkObj.connectedNodes[end].id === oldID) {
                                // If the current end node id matches this Node.
                                // Gets the connected Node's connected attribute ID.
                                let connAttrID = linkObj.relatedAttrs[end].attrID

                                // ORDER MATTERS HERE, AND HAS TO BE DONE FROM THE LINK, AS LINK HAS TO REMOVE THE NODE'S ID FROM ITSELF.
                                linkObj.removeNode(parseInt(end));
                                nodeObj.setID(newID);
                                this.addNode(nodeObj);
                                linkObj.addNode(nodeObj, connAttrID, parseInt(end));
                            }
                        }
                    } else {
                        // If the connected Link is not found in the temp array.
                        // Remove the old connected Link.
                        nodeObj.removeLink(linkID);
                        // set a new ID for Node.
                        nodeObj.setID(newID);
                        // Attempts to push to working array.
                        this.addNode(nodeObj);
                    }
                }
            } else {
                // If the current Node does not have Links connected to it.
                // Sets a new ID for Node.
                nodeObj.setID(newID);
                // Attempts to push to working array.
                this.addNode(nodeObj);
            }

            // incredibly wasteful, but is needed to show duplicate table name errors when pasting.
            this.checkTableTitle(nodeObj, nodeObj.title.name);
            this.updateOtherNodesErrors(nodeObj);
        }


        // Returns to canvas so new objects can be selected.
        return [...tempLinks, ...tempNodes];
    }

    // Stores the dragged item's ID. Ref: https://stackoverflow.com/questions/13578657/how-to-drag-an-image-after-drop-onto-html5-canvas
    dragStart = e => {
        // Stores info in Type, as function dragOver has no read access to type data.
        e.dataTransfer.setData(e.target.id, "");
        // Replaces the drag ghost image with a blank image. Ref: https://stackoverflow.com/questions/38655964/how-to-remove-dragghost-image
        var img = new Image();
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        e.dataTransfer.setDragImage(img, 0, 0);
    }

    // Clears canvas' tempObj and redraws canvas on any item drop event.
    dragEnd = e => {
        canvasObj.tempObj = undefined;
        canvasObj.draw();
    }
};

class ERD extends Graph {
    constructor() {
        super();
        this.GenerateItemMenu();
    }

    // Generates the catalogue menu.
    // MAYBE A SEPERATE CLASS SHOULD BE USED FOR THE ITEM MENU??
    GenerateItemMenu() {
        // Function that creates a category section with the given name.
        function createCategory(name) {
            // Function that allows for the opening and closing of categories on the item menu.
            // Ref: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_accordion
            function catToggle(cat) {
                // childNodes doesn't return a standard array for some reason. Spread operator is needed to place all elements into an array.
                let container = [...cat.childNodes].find(n => n.className === "category_container");
                // This is just dirty.
                let arrow = [...[...cat.childNodes].find(n => n.className === "category_title_div").childNodes].find(n => n.className === "category_arrow_down" || n.className === "category_arrow_up");

                // toggles the opening and closing of the container.
                if (container) {
                    if (container.style.display === "block") {
                        container.style.display = "none";
                        arrow ? arrow.className = "category_arrow_up" : "";
                    } else {
                        container.style.display = "block";
                        arrow ? arrow.className = "category_arrow_down" : "";
                    }
                }
            }

            // Creates the category parent div.
            let cat = document.createElement("div");
            cat.id = name.toLowerCase() + "_category";
            cat.className = "category";

            // Creates the title div for the category.
            let titleDiv = document.createElement("div");
            titleDiv.id = name.toLowerCase() + "_category_title_div";
            titleDiv.className = "category_title_div";
            titleDiv.addEventListener("click", () => {
                catToggle(cat);
            });
            // Creates the title text.
            let title = document.createElement("h3");
            title.id = name.toLowerCase() + "_category_title";
            title.className = "category_title";
            title.innerHTML = name;
            // Creates the section display arrow indicator.
            let arrow = document.createElement("div");
            arrow.className = "category_arrow_down";
            // Adds all sections of the title to the category.
            titleDiv.appendChild(title);
            titleDiv.appendChild(arrow);
            cat.appendChild(titleDiv);

            // Creates the item div.
            let container = document.createElement("div");
            container.id = name.toLowerCase() + "_category_container";
            container.className = "category_container";
            // Needed for toggle to work on first click.
            container.style.display = "block"
            cat.appendChild(container);

            return cat;
        }

        // function that create a item with the given name, and image URL.
        function createItem(name, src, graphObj) {
            let item = document.createElement("img");
            item.id = name;
            item.className = "item";
            item.src = src;
            item.alt = name;

            // Used to bind drag drop events to the item.
            item.draggable = "true";
            item.addEventListener("dragstart", graphObj.dragStart);
            item.addEventListener("dragend", graphObj.dragEnd);

            return item;
        }

        // Gets the menu.
        const menu = document.getElementById("item_menu");

        // Creates Nodes section.
        let cat = createCategory("Nodes");
        // Finds the container.
        let container = [...cat.childNodes].find(n => n.className === "category_container");
        // Adds the relation table item to the container.
        container.appendChild(createItem("relation_table", "images/relation_table.png", this));
        // Adds the section to the menu.
        document.getElementById("item_menu").appendChild(cat);


        // Creates the Links section, and does the same as the Nodes above.
        cat = createCategory("Links")
        container = [...cat.childNodes].find(n => n.className === "category_container");
        container.appendChild(createItem("association", "images/association.png", this));
        document.getElementById("item_menu").appendChild(cat);
    }

    // Generates a default object on the canvas.
    generateObj(itemID, mX, mY) {
        let tempObj = undefined;

        switch (itemID) {
            case "relation_table":
                //Adds a node object to the nodes array
                tempObj = new RelationTable(new Date().valueOf(), parseInt(mX), parseInt(mY), 150, 200);
                this.addNode(tempObj);
                // Validates new node with existing nodes. Title only.
                if (this.nodes.length > 1) {
                    this.checkTableTitle(tempObj, tempObj.title.name);
                    this.updateOtherNodesErrors(tempObj);
                }
                break;
            case "association":
                //Adds a link object to the links array
                tempObj = new Association(new Date().valueOf(), parseInt(mX), parseInt(mY), parseInt(mX + 200), parseInt(mY));
                this.addLink(tempObj);
                this.updateThisAssociationErrors(tempObj);
                break;
            default:
                console.log("Invalid item dropped onto canvas");
                break;
        }
    }

    // Generates a "Ghost" object on the canvas.
    returnGhostObj(itemID) {
        let tempObj = undefined;

        switch (itemID) {
            case "relation_table":
                // Sets tempObj as RelationTable.
                tempObj = new RelationTable(new Date().valueOf(), 0, 0, 150, 200);
                break;
            case "association":
                // Sets tempObj as Association.
                tempObj = new Association(new Date().valueOf(), 0, 0, 200, 0);
                break;
            default:
                console.log("Invalid item dragged onto canvas");
                break;
        }

        return tempObj;
    }

    // Deletes the given object from the graph.
    // Used to hold the processes now handled by the object.deleteFormat() function.
    removeObj(workingObj) {
        switch (workingObj.constructor.name) {
            case "RelationTable":
                // Calls the function that resets some non essential vars and handles the process of deletion.
                workingObj.deleteFormat();
                this.nodes.splice(this.nodes.indexOf(workingObj), 1);

                // Last minute fix to delete not updating duplicate title error.
                // incredibly wasteful, but is needed to remove duplicate table name errors when cutting.
                this.checkTableTitle(workingObj, workingObj.title.name);
                this.updateOtherNodesErrors(workingObj);
                break;
            case "Association":
                // Calls the function that resets some non essential vars and handles the process of deletion.
                workingObj.deleteFormat();
                this.links.splice(this.links.indexOf(workingObj), 1);
                break;
        }
    }

    // Checks the table's title for validity.
    checkTableTitle(refObj, name) {
        // Holds the result of the check.
        let result = {
            itemID: "table",
            errorCat: "name",
            errorMsg: undefined,
            errorType: "valid"
        };

        // Regex for matching only letters, numbers, underscores, and spaces.
        let regex = /^[a-zA-Z0-9_ ]+$/;

        // If a title is given.
        if (name) {
            // Gets the matching nodes and calculates the number of matches.
            let matchingNodes = this.nodes.filter(nodeObj => nodeObj.title.name.toLowerCase() === name.toLowerCase() && nodeObj !== refObj);
            let matchNo = matchingNodes ? matchingNodes.length : 0;

            // If there are any special characters in the string.
            if (!regex.test(name)) {
                result.errorMsg = "Title: must only contain letters, numbers, underscores, and spaces.";
                result.errorType = "invalid";
            }

            // If there are duplicate titles between tables.
            if (matchNo > 0) {
                result.errorType = "invalid";
                // If there is already a error message.
                if (result.errorMsg) {
                    result.errorMsg += " + matches " + matchNo + " other ";
                    result.errorMsg += (matchNo > 1) ? "tables." : "table.";
                } else {
                    result.errorMsg = "Title: matches " + matchNo + " other ";
                    result.errorMsg += (matchNo > 1) ? "tables." : "table.";
                }
            }

            // Updates the error object of the referenced object.
            refObj.updateErrors(result);
            return result;
        } else {
            // Title was not given.
            result.errorMsg = "Title: cannot be left blank.";
            result.errorType = "invalid";

            // Updates the error object of the referenced object.
            refObj.updateErrors(result);
            return result;
        }
    }

    // Checks the table's attribute name for validity.
    checkTableAttrName(refObj, attrID, name) {
        // Holds an array of result of the validatdion.
        let result = {
            itemID: "attr_" + attrID,
            errorCat: "name",
            errorMsg: undefined,
            errorType: "valid"
        };

        // Regex for matching only letters, numbers, underscores, and spaces.
        let regex = /^[a-zA-Z0-9_ ]+$/;

        // Gets the attribute place in list, as ID is not easy to read.
        let attrNo = refObj.attributes.findIndex(attrObj => attrObj.id === attrID);

        // If a attribute name is given.
        if (name) {
            // Gets the matching nodes and calculates the number of matches.
            let matchingAttrs = refObj.attributes.filter(attrObj => attrObj.name.toLowerCase() === name.toLowerCase() && attrObj.id !== attrID);
            let matchNo = matchingAttrs ? matchingAttrs.length : 0;

            // If there are any special characters in the string.
            if (!regex.test(name)) {
                result.errorMsg = "Attribute " + (attrNo + 1) + ": must only contain letters, numbers, underscores, and spaces.";
                result.errorType = "invalid";
            }

            // If there are duplicate titles between tables.
            if (matchNo > 0) {
                result.errorType = "invalid";
                // If there is already a error message.
                if (result.errorMsg) {
                    result.errorMsg += " + matches " + matchNo + " other ";
                    result.errorMsg += (matchNo > 1) ? "attributes." : "attribute.";
                } else {
                    result.errorMsg = "Attribute " + (attrNo + 1) + ": matches " + matchNo + " other ";
                    result.errorMsg += (matchNo > 1) ? "attributes." : "attribute.";
                }
            }

            // Updates the error object of the referenced object.
            refObj.updateErrors(result);
            return result;
        } else {
            // Attribute name was not given.
            result.errorMsg = "Attribute " + (attrNo + 1) + ": cannot be left blank.";
            result.errorType = "invalid";

            // Updates the error object of the referenced object.
            refObj.updateErrors(result);
            return result;
        }
    }

    // Checks for unconnected FK, and CKs, or connected ATs
    checkTableAttrTypeConn(refObj, attrID, type) {
        // result object that holds the validation data.
        let result = {
            itemID: "attr_" + attrID,
            errorCat: "type",
            errorMsg: undefined,
            errorType: "valid"
        };

        // Gets the attribute place in list, as ID is not easy to read.
        let attrNo = refObj.attributes.findIndex(attrObj => attrObj.id === attrID);

        // If it's a FK, CK, or AT. Otherwise return a valid result if it's a PK.
        if (type === "FK" || type === "CK" || type === "AT") {
            // Loops through all the connected links of the table.
            for (let linkID of refObj.connectedLinks) {
                // Loops through all the ends of the current connected link.
                let linkObj = this.links.find(linkObj => linkObj.id === linkID);
                for (let end of Object.keys(linkObj.relatedAttrs)) {
                    // If the attribute is a FK and a link end attribute ID matches the given attribute's ID (is connected) then return a valid result. Else if the attribute is a AT and a link end attribute ID matches the given attribute's ID (is connected) then return a invalid result.
                    if (linkObj.relatedAttrs[end].attrID === attrID && (type === "FK")) {
                        // Updates the error object of the referenced object.
                        refObj.updateErrors(result);
                        return result;
                    } else if (linkObj.relatedAttrs[end].attrID === attrID && type === "AT") {
                        result.errorMsg = "Attribute " + (attrNo + 1) + ": should not be linked. Change to a PK, or FK if needs to be linked.";
                        result.errorType = "invalid";

                        // Updates the error object of the referenced object.
                        refObj.updateErrors(result);
                        return result;
                    }
                }
            }
            // If no connected link end attribute IDs matched the given attribute's ID then return a invalid result.
            if (type !== "AT") {
                result.errorMsg = "Attribute " + (attrNo + 1) + ": requires a link.";
                result.errorType = "invalid";

                // Updates the error object of the referenced object.
                refObj.updateErrors(result);
                return result;
            }
        }

        // Returns valid result if attribute is a PK, or AT with no connections.
        // Updates the error object of the referenced object.
        refObj.updateErrors(result);
        return result;
    }

    // Checks if there are any PK, FK, or CKs in the table.
    checkTableAttrTypeCount(refObj) {
        // result object that holds the validation data.
        let result = {
            itemID: "table",
            errorCat: "unique_key",
            errorMsg: undefined,
            errorType: "valid"
        };

        let pkCount = 0;
        let fkCount = 0;

        for (let attr of refObj.attributes) {
            if (attr.type === "PK") pkCount++;
            if (attr.type === "FK") fkCount++;
        }

        let total = pkCount + fkCount;
        // Check if there's at least one unique identifier in table.
        if (total <= 0) {
            result.errorMsg = "Table: missing a unique identifier. PK, or FK must be present in table.";
            result.errorType = "invalid";
        }

        // Updates the error object of the referenced object.
        refObj.updateErrors(result);
        return result;
    }

    // Runs a various error checks for errors that can affect more than one table.
    // Used in combination with a single check to get 1 table to exclude.
    updateOtherNodesErrors(excludedNodeObj) {
        for (let nodeObj of this.nodes.filter(nodeObj => nodeObj !== excludedNodeObj)) {
            // Checks all other titles for validity.
            this.checkTableTitle(nodeObj, nodeObj.title.name);
        }
    }

    // Runs a various error checks for errors that can affect more than one attribute.
    // Used in combination with a single check.
    updateThisNodeErrors(nodeObj) {
        // Checks all attributes for validity.
        for (let attrObj of nodeObj.attributes) {
            this.checkTableAttrName(nodeObj, attrObj.id, attrObj.name);
            this.checkTableAttrTypeConn(nodeObj, attrObj.id, attrObj.type);
            this.checkTableAttrTypeCount(nodeObj);
        }
    }

    // Runs various error checks for node errors that can occur when a link connection is changed.
    updateLinkNodeErrors(linkObj) {
        // Loops through connected nodes and checks the type validation when a connection is changed.
        for (let nodeNo of Object.keys(linkObj.connectedNodes)) {
            let nodeObj = this.nodes.find(nodeObj => nodeObj.id === linkObj.connectedNodes[nodeNo].id);
            if (nodeObj) {
                for (let attrObj of nodeObj.attributes) {
                    this.checkTableAttrTypeConn(nodeObj, attrObj.id, attrObj.type);
                }
            }
        }
    }

    // Checks the given association's given end for a connection.
    checkAssociationEndConn(refObj, end) {
        // result object that holds the validation data.
        let result = {
            itemID: "end_" + end,
            errorCat: "connection",
            errorMsg: undefined,
            errorType: "valid"
        };

        if (!refObj.connectedNodes[end].id) {
            result.errorMsg = "End " + end + ": is not connected.";
            result.errorType = "invalid";
        }

        refObj.updateErrors(result);
        return result;
    }

    // Checks the given association's connection for valid attribute types.
    checkAssociationEndType(refObj, end) {
        // result object that holds the validation data.
        let result = {
            itemID: "end_" + end,
            errorCat: "type",
            errorMsg: undefined,
            errorType: "valid"
        };

        // If the given end has a node id.
        if (refObj.connectedNodes[end].id) {
            // Gets the connected node's attribute's type.
            const nodeObj = this.nodes.find(nodeObj => nodeObj.id === refObj.connectedNodes[end].id);
            const attrType = nodeObj ? nodeObj.attributes.find(attr => attr.id === refObj.relatedAttrs[end].attrID).type : undefined;
            const otherEnd = (Number(end) === 1) ? 0 : 1;

            if (attrType === "AT") {
                result.errorMsg = "End " + end + ": cannot be connected to a AT attribute.";
                result.errorType = "invalid";
            } else if (refObj.connectedNodes[otherEnd].id) {
                // Gets the other connected node's attribute's type.
                const otherNodeObj = this.nodes.find(nodeObj => nodeObj.id === refObj.connectedNodes[otherEnd].id);
                const otherAttrType = otherNodeObj ? otherNodeObj.attributes.find(attr => attr.id === refObj.relatedAttrs[otherEnd].attrID).type : undefined;
                // Will be an error if both ends are connected to the same type of attribute.
                // Assumed FK should only connect to PK attributes. Left as warning instead of invalid.
                if (attrType === otherAttrType) {
                    if (attrType === "PK") {
                        result.errorMsg = "End " + end + ": both ends connected to PK attributes. Change one end to a FK attribute.";
                        result.errorType = "invalid";
                    } else if (attrType === "FK") {
                        result.errorMsg = "End " + end + ": both ends connected to FK attributes. It would be best to connect one end to the PK attribute.";
                        result.errorType = "warning";
                    }
                }
            }
        }

        refObj.updateErrors(result);
        return result;
    }

    // Check for invalid connection oon the given end.
    checkAssociationEndRel(refObj, end) {
        // result object that holds the validation data.
        let result = {
            itemID: "end_" + end,
            errorCat: "relation",
            errorMsg: undefined,
            errorType: "valid"
        };

        // Checks if there are any type or connection errors then relationships are not checked.
        // Used to check for only invalid errors.
        let errorBlock = false;
        for (let errorItem of Object.keys(refObj.errors)) {
            for (let errorCat of Object.keys(refObj.errors[errorItem])) {
                if (refObj.errors[errorItem]["type"] || refObj.errors[errorItem]["connection"]) {
                    errorBlock = true;
                }
            }
        }

        // If there are no type or connection errors then check relationship.
        if (!errorBlock) {
            // Gets the connected node's attribute's type.
            const nodeObj = this.nodes.find(nodeObj => nodeObj.id === refObj.connectedNodes[end].id);
            const attrType = nodeObj ? nodeObj.attributes.find(attr => attr.id === refObj.relatedAttrs[end].attrID).type : undefined;
            const attrRel = refObj.relatedAttrs[end].relation;
            // Gets the other end of the link.
            const otherEnd = (Number(end) === 1) ? 0 : 1;
            // Gets the other connected node's attribute's type.
            const otherNodeObj = this.nodes.find(nodeObj => nodeObj.id === refObj.connectedNodes[otherEnd].id);
            const otherAttrType = otherNodeObj ? otherNodeObj.attributes.find(attr => attr.id === refObj.relatedAttrs[otherEnd].attrID).type : undefined;
            const otherAttrRel = refObj.relatedAttrs[otherEnd].relation;

            // If there is a many to many relationship.
            // Else if there is a One to One relationship.
            // Else if there is a many to One OR one to many relationship. No Idea if there is a cleaner way to do this.
            if ((attrRel === "1...*" || attrRel === "0...*") && (otherAttrRel === "1...*" || otherAttrRel === "0...*")) {
                result.errorMsg = "End " + end + ": both ends have a many relation. Many to many relationships can be resolved by using a intermediate table to link the two tables.";
                result.errorType = "invalid";
            } else if (((attrRel === "0...1" || attrRel === "1...1") && (otherAttrRel === "1...*" || otherAttrRel === "0...*")) || ((attrRel === "1...*" || attrRel === "0...*") && (otherAttrRel === "0...1" || otherAttrRel === "1...1"))) {
                // If current end is many and PK then error.
                if ((attrRel === "0...*" || attrRel === "1...*") && attrType === "PK") {
                    result.errorMsg = "End " + end + ": many relation on the primary key side. Many relationship should be on foreign key side.";
                    result.errorType = "invalid";
                }
            }
        }

        refObj.updateErrors(result);
        return result;
    }

    // Does all the validation for the ends of the given association. Really not good.
    // Needs two seperate loops, as checking relations relies on the errors produced from the first two.
    updateThisAssociationErrors(linkObj) {
        for (let nodeNo of Object.keys(linkObj.connectedNodes)) {
            this.checkAssociationEndConn(linkObj, nodeNo);
            this.checkAssociationEndType(linkObj, nodeNo);
        }
        for (let nodeNo of Object.keys(linkObj.connectedNodes)) {
            this.checkAssociationEndRel(linkObj, nodeNo);
        }
    }
};
