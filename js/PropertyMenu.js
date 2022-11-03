class PropertyMenu {
    constructor(refObj) {
        // Specific to the elements in property_menu.
        this.propertyMenu = document.getElementById("property_menu");
        this.open = false;
        this.constElements = [document.getElementById("property_menu_close_button")];

        // General refObj object attributes that most nodes and links should have.
        if (refObj) {
            this.refObj = refObj
        } else {
            this.refObj = undefined;
        }
    }

    // Opens the menu.
    openMenu = e => {
        document.getElementById("property_menu_close_button").addEventListener("mousedown", this.closeMenu);
        if (this.propertyMenu.style.width === "0%") {
            this.propertyMenu.style.width = "20%";
            this.propertyMenu.style.padding = "10px";
            this.open = true;
        }
    }

    // Closes the menu.
    closeMenu = e => {
        document.getElementById("property_menu_close_button").removeEventListener("mousedown", this.closeMenu);
        if (this.propertyMenu.style.width != "0%") {
            this.propertyMenu.style.width = "0%";
            this.propertyMenu.style.padding = "0px";
            this.open = false;
            this.clearData();
        }
    }

    onInput = e => {
        this.inputBoxUpdate(e);
    }

    selectChange = e => {
        this.selectBoxUpdate(e);
    }

    buttonClick = e => {
        this.buttonClickUpdate(e);
    }

    // Splits the event element number.
    getIDNo(element) {
        if (/\d/.test(element)) {
            return Number(element.slice(element.lastIndexOf("_") + 1, element.length));
        }
    }

    // removes every child element of the property menu except for the constant elements.
    clearMenu() {
        let children = [];

        // Fills a temp array with all children elements that aren't constant. Don't be this stupid again, you cannot delete from the array you're working with.
        for (let child of this.propertyMenu.children) {
            if (!this.constElements.includes(child)) {
                children.push(child);
            }
        }

        // Removes all unwanted children.
        for (let child of children) {
            this.propertyMenu.removeChild(child);
        }
    }

    // Clears the attributes.
    clearData() {
        this.refObj = undefined;
        this.clearMenu();
    }

    generateErrorText() {
        let errorDiv = document.getElementById("errors");
        // If there's a error div then remove all children. Otherwise generate the div.
        if (errorDiv) {
            while (errorDiv.firstChild) {
                errorDiv.removeChild(errorDiv.firstChild);
            }
        } else {
            errorDiv = document.createElement("div");
            errorDiv.style = "width: 90%; margin-top: 20px; margin-left: 5%; margin-right: 5%; margin-bottom: 20px;";
            errorDiv.id = "errors";
            this.propertyMenu.appendChild(errorDiv);
        }

        // If there is a error in the error object.
        if (Object.keys(this.refObj.errors).length > 0) {
            // Creates the error title.
            let errorTitle = document.createElement("p");
            errorTitle.id = "error_title";
            errorTitle.style = "text-align:left; font-size: 18px;";
            // If there's only one error item and multiple error types then it still thinks it's singular. FIX LATER.
            errorTitle.innerHTML = (Object.keys(this.refObj.errors).length > 1) ? "Errors:" : "Error:";
            errorDiv.appendChild(errorTitle);

            // Loops down into the errorType which can be used to get the error message.
            for (let errorItem of Object.keys(this.refObj.errors)) {
                for (let errorType of Object.keys(this.refObj.errors[errorItem])) {
                    // Creates the error text.
                    let errorText = document.createElement("p");
                    errorText.id = "error_" + errorType;
                    errorText.innerHTML = this.refObj.errors[errorItem][errorType].errorMsg;
                    errorDiv.appendChild(errorText);
                }
            }
        }
    }
};
class AssociationMenu extends PropertyMenu {
    constructor(refObj) {
        super(refObj);
        this.title = undefined;
        this.connectedNodes = undefined;
        this.relatedAttrs = undefined;
    }

    inputBoxUpdate(e) {
        // Gets the elements corresponding end number.
        let endNo = Number(this.getIDNo(e.target.id));
        let value = e.target.value;

        switch (e.target.id) {
            case "rel_vert_pos_input_" + endNo:
                this.refObj.setRelatedAttrOnBottom(endNo, e.target.checked);
                break;
            case "rel_horz_pos_input_" + endNo:
                this.refObj.setRelatedAttrHorzPosPerc(endNo, value);
                break;
            default:
                break;
        }

        // Updates the drawn objects.
        canvasObj.draw();
    }

    selectBoxUpdate(e) {
        // Gets the elements corresponding end number.
        let endNo = Number(this.getIDNo(e.target.id));
        let value = e.target.value;

        // Handles the change to the attribute type.
        switch (e.target.id) {
            case "rel_relation_input_" + endNo:
                this.refObj.setRelatedAttrRelation(endNo, value);
                break;
            case "rel_attr_input_" + endNo:
                this.refObj.setRelatedAttrID(endNo, value);
                break;
            default:
                break;
        };

        // Refreshes the property menu for a button click. Also updates the error section so there's no call for it here.
        this.generateMenu();
        this.updateInputBoxFeedback();

        // Updates the drawn objects.
        canvasObj.draw();
    }

    // Sets all menu attributes from the reference object.
    getData() {
        this.connectedNodes = this.refObj.connectedNodes;
        this.relatedAttrs = this.refObj.relatedAttrs;
        // Resets the title attribute, because this code is a mess and I have no idea where this is called anymore. Title adds on to it self when a point is moved.
        this.title = undefined;

        // Loops through all the connected nodes and appends their titles to create the link's title.
        for (let nodeNo of Object.keys(this.connectedNodes)) {
            let nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[nodeNo].id);
            let nodeTitle = nodeObj ? nodeObj.title.name : "Undefined";

            if (this.title) {
                this.title += " - " + nodeTitle;
            } else {
                this.title = "Link: " + nodeTitle;
            }
        }
    }

    // Clears the attributes.
    clearData() {
        this.title = undefined;
        this.connectedNodes = undefined;
        this.relatedAttrs = undefined;
        this.clearMenu();
    }

    // Creates the text and input for the property menu.
    generateMenu(open) {
        if (this.refObj) {
            // Gets the the changable data from the reference object.
            this.getData();
            // Clears the menu.
            this.clearMenu();

            // Holds the elements that'll make up the property menu.
            let childElements = [];
            // Holds the relationship values.
            let relTypes = ["1...1", "0...*", "1...*", "0...1"];

            // Creates the title.
            let title = document.createElement("p");
            title.id = "title";
            title.style = "display: inline-block; width: 90%; padding-bottom: 5px; margin-top: 10px; margin-left: 5%; margin-right: 5%; margin-bottom: 30px; text-align: center; font-size: 22px; border: 2px #283747 solid;";
            title.innerHTML = this.title;
            childElements.push(title);

            // Creates the elements presenting the attribute properties.
            let i = 0;
            for (let rel in this.relatedAttrs) {
                // Holds the node object that's attached to the link end.
                // Gets the node object depending on the link end being processed.
                let nodeObj = canvasObj.graphObj.nodes.find(nodeObj => nodeObj.id === this.connectedNodes[i].id);

                // Creates the related attribute's div.
                let relDiv = document.createElement("div");
                relDiv.style = "width: 90%; margin-top: 30px; margin-left: 5%; margin-right: 5%; margin-bottom: 20px;";
                relDiv.id = "rel_" + i;

                // Creates the related table titles.
                let relTitle = document.createElement("p");
                relTitle.style = "display: block; padding: 0px; margin: 0px; margin-bottom: 5px;";
                relTitle.innerHTML = "Table: ";
                relTitle.innerHTML += nodeObj ? nodeObj.title.name : "undefined";
                relDiv.appendChild(relTitle);

                // Creates the drop down for the relation types.
                let relTypeInput = document.createElement("select");
                relTypeInput.id = "rel_relation_input_" + i;
                relTypeInput.style = "margin-right: 5px; width: 55px;";
                for (let type of relTypes) {
                    let typeOption = document.createElement("option");
                    typeOption.value = type;
                    typeOption.text = type;
                    relTypeInput.appendChild(typeOption);
                }
                relTypeInput.value = this.relatedAttrs[i].relation;
                // Bind relation type input to an event handler.
                relTypeInput.onchange = this.selectChange;
                relDiv.appendChild(relTypeInput)

                // Creates the selection box for the related table attributes name.
                let relAttrInput = document.createElement("select");
                relAttrInput.id = "rel_attr_input_" + i;
                relAttrInput.style = "width: calc(100% - 60px);";
                // If there are attributes then fill relAttrInput options with node attributes and set linked attribute as value. Otherwise set "-" as value.
                let nodeAttrs = nodeObj ? nodeObj.attributes : undefined;
                if (nodeAttrs) {
                    for (let attr of nodeAttrs) {
                        let attrOption = document.createElement("option");
                        attrOption.value = attr.id;
                        attrOption.text = attr.name;
                        relAttrInput.appendChild(attrOption);
                    }
                    relAttrInput.value = nodeAttrs.find(attr => attr.id === this.relatedAttrs[i].attrID).id;
                    // Binds relation attribute input to an event handler.
                    relAttrInput.onchange = this.selectChange;
                } else {
                    let attrOption = document.createElement("option");
                    attrOption.value = "-";
                    attrOption.text = "-";
                    relAttrInput.appendChild(attrOption);
                    relAttrInput.value = "-";
                    // Binds relation attribute input to an event handler.
                    relAttrInput.onchange = this.selectChange;
                }
                relDiv.appendChild(relAttrInput);

                // Creates the toggle switch to adjust relation text vertical placement.
                let relTextToggleLabel = document.createElement("label");
                relTextToggleLabel.id = "rel_vert_pos_label_" + i;
                relTextToggleLabel.className = "rel_vert_pos_label";
                let relTextToggleInput = document.createElement("input");
                relTextToggleInput.id = "rel_vert_pos_input_" + i;
                relTextToggleInput.className = "rel_vert_pos_input";
                relTextToggleInput.type = "checkbox";
                relTextToggleInput.checked = this.relatedAttrs[i].onBottom;
                relTextToggleInput.oninput = this.onInput;
                relTextToggleLabel.appendChild(relTextToggleInput);
                let relTextToggleSpan = document.createElement("span");
                relTextToggleSpan.id = "rel_vert_pos_span" + i;
                relTextToggleSpan.className = "rel_vert_pos_span";
                relTextToggleLabel.appendChild(relTextToggleSpan);
                relDiv.appendChild(relTextToggleLabel);

                // Creates the slider to adjust the relation text horizontally.
                let relTextSlider = document.createElement("input");
                relTextSlider.id = "rel_horz_pos_input_" + i;
                relTextSlider.className = "rel_horz_pos_input";
                relTextSlider.type = "range";
                relTextSlider.min = "1";
                relTextSlider.max = "100";
                relTextSlider.value = this.relatedAttrs[i].horzPosPerc;
                relTextSlider.oninput = this.onInput;
                relDiv.appendChild(relTextSlider);

                i++;
                childElements.push(relDiv);
            }

            // Adds all child elements to the property menu.
            for (let elements of childElements) {
                this.propertyMenu.appendChild(elements);
            }

            // Creates the error section.
            this.generateErrorText();
            this.updateInputBoxFeedback();

            // Opens the menu if open is true.
            if (open === true) {
                this.openMenu();
            }
        }
    }

    // Sets the invalid shadows around the input and selection boxes for elements that are holding invalid values.
    updateInputBoxFeedback() {
        // Lazy way to reset the validity of the input boxes.
        let selectBoxes = document.getElementsByTagName("select");
        for (let selectBox of selectBoxes) {
            selectBox.setCustomValidity("");
        }

        // Sets the custom validity text and shadow on the input boxes linked to the error item and type.
        for (let errorItem of Object.keys(this.refObj.errors)) {
            for (let errorCat of Object.keys(this.refObj.errors[errorItem])) {
                if (errorItem.includes("end_") && errorCat.includes("relation")) {
                    let endNo = this.getIDNo(errorItem);
                    let inputBox = document.getElementById("rel_relation_input_" + endNo);
                    inputBox.setCustomValidity(this.refObj.errors[errorItem][errorCat].errorMsg)
                } else if (errorItem.includes("end_") && errorCat.includes("type")) {
                    let endNo = this.getIDNo(errorItem);
                    let inputBox = document.getElementById("rel_attr_input_" + endNo);
                    inputBox.setCustomValidity(this.refObj.errors[errorItem][errorCat].errorMsg)
                }
            }
        }
    }
};
class RelationTableMenu extends PropertyMenu {
    constructor(refObj) {
        super(refObj);
        this.title = undefined;
        this.attributes = undefined;
    }

    inputBoxUpdate(e) {
        // Gets the elements corresponding attribute number.
        let eleNum = this.getIDNo(e.target.id);
        // Basic format of input value.
        let value = e.target.value.trim();
        // Holds the input validation results.
        let checkResult

        // Handles the updates for the node's title, and attribute names.
        switch (e.target.id) {
            case "title_input":
                // Set the table's title.
                this.refObj.setTitle(value);
                break;
            case "attr_name_input_" + eleNum:
                // Set the table's attribute name.
                this.refObj.setAttributeName(eleNum, value);
                break;
            default:
                break;
        };

        // Generate a new error section of the menu.
        this.generateErrorText();
        this.updateInputBoxFeedback();

        // Updates the drawn object.
        canvasObj.draw();
    }

    selectBoxUpdate(e) {
        // Gets the elements corresponding attribute number.
        let eleNum = this.getIDNo(e.target.id);
        // Basic format of input value.
        let value = e.target.value;
        // Holds the input validation results.
        let checkResult

        // Handles the change to the attribute type.
        switch (e.target.id) {
            case "attr_type_input_" + eleNum:
                // Set the table's attribute type.
                this.refObj.setAttributeType(eleNum, value);
                break;
            default:
                break;
        };

        // Generate a new error section of the menu.
        this.generateErrorText();
        this.updateInputBoxFeedback();

        // Updates the drawn object.
        canvasObj.draw();
    }

    buttonClickUpdate(e) {
        // Gets the elements corresponding attribute number.
        let eleNum = this.getIDNo(e.target.id);

        // Handles the attribute delete, addition, and re ordering changes.
        switch (e.target.id) {
            case "del_attr_button_" + eleNum:
                this.refObj.delAttribute(eleNum);
                break;
            case "add_attr_button":
                this.refObj.addAttribute();
                break;
            case "up_attr_button_" + eleNum:
                let prevAttrID = this.getIDNo(document.getElementById("attr_" + eleNum).previousElementSibling.id);
                this.refObj.swapAttributes(eleNum, prevAttrID);
                break;
            case "down_attr_button_" + eleNum:
                let nextAttrID = this.getIDNo(document.getElementById("attr_" + eleNum).nextElementSibling.id);
                this.refObj.swapAttributes(eleNum, nextAttrID);
                break;
            default:
                break;
        };

        // Refreshes the property menu for a button click. Also updates the error section so there's no call for it here.
        this.generateMenu();

        // Updates the drawn object.
        canvasObj.draw();
    }

    // Sets all menu attributes from the reference object.
    getData() {
        this.title = this.refObj.title.name;
        this.attributes = this.refObj.attributes;
    }

    // Clears the attributes.
    clearData() {
        this.title = undefined;
        this.attributes = undefined;
        this.clearMenu();
    }

    // Creates the text and input for the property menu.
    generateMenu(open) {
        if (this.refObj) {
            // Gets the the changable data from the reference object.
            this.getData();
            // Clears the menu.
            this.clearMenu();

            // Holds the elements that'll make up the property menu.
            let childElements = [];
            // Holds the attribute type values.
            let attrTypes = ["PK", "FK", "AT"];

            // Creates the input box for the table's title.
            let titleInput = document.createElement("input");
            titleInput.id = "title_input";
            titleInput.type = "text";
            titleInput.style = "display: inline-block; width: 90%; height: 40px; margin-top: 20px; margin-left: 5%; margin-right: 5%; margin-bottom: 30px; text-align: center; font-size: 24px; border: 2px #283747 solid;";
            titleInput.required = true;
            titleInput.value = this.title;
            titleInput.oninput = this.onInput;
            childElements.push(titleInput);

            // Creates the elements presenting the attribute properties.
            for (let i = 0; i < this.attributes.length; i++) {
                // Creates the attribute's div.
                let attrDiv = document.createElement("div");
                attrDiv.style = "width: 90%; margin-top: 20px; margin-left: 5%; margin-right: 5%; margin-bottom: 20px;";
                attrDiv.id = "attr_" + this.attributes[i].id;

                // Creates the delete attribute button.
                let delAttrButton = document.createElement("a");
                delAttrButton.id = "del_attr_button_" + this.attributes[i].id;
                if (this.attributes.length <= 1) {
                    delAttrButton.className = "disabled_button";
                } else {
                    delAttrButton.className = "button";
                    // Binds the click listner to the delete button.
                    delAttrButton.onclick = this.buttonClick;
                }
                delAttrButton.style = "text-align: center; padding: 0px; width: 1em; font-size: 18px;";
                delAttrButton.innerHTML = "&times;";
                attrDiv.appendChild(delAttrButton);

                // Creates the increase order button.
                let upOrderButton = document.createElement("a");
                upOrderButton.id = "up_attr_button_" + this.attributes[i].id;
                upOrderButton.className = "button";
                upOrderButton.style = "text-align: center; padding: 0px; margin-left: 5px; width: 1em; font-size: 18px;";
                upOrderButton.innerHTML = "&uarr;";
                // Binds click listener on up order button.
                upOrderButton.onclick = this.buttonClick;

                // Creates the decrease order.
                let downOrderButton = document.createElement("a");
                downOrderButton.id = "down_attr_button_" + this.attributes[i].id;
                downOrderButton.className = "button";
                downOrderButton.style = "text-align: center; padding: 0px; width: 1em; font-size: 18px;";
                downOrderButton.innerHTML = "&darr;";
                // Binds click listener to the down order button.
                downOrderButton.onclick = this.buttonClick;

                // if it's the first attribute then set to a disabled up order button and remove the on click event listener. 
                if (i === 0) {
                    upOrderButton.className = "disabled_button";
                    upOrderButton.onclick = null;
                }

                // If it's the last / only attribute then set to a disabled up order button and remove the on click event listener.
                if (i === this.attributes.length - 1 || this.attributes.length === 1) {
                    downOrderButton.className = "disabled_button";
                    downOrderButton.onclick = null;
                }

                attrDiv.appendChild(upOrderButton);
                attrDiv.appendChild(downOrderButton);

                attrDiv.appendChild(document.createElement("br"));

                // Creates the drop down for the attribute types.
                let attrTypeInput = document.createElement("select");
                attrTypeInput.id = "attr_type_input_" + this.attributes[i].id;
                attrTypeInput.style = "margin-top: 5px; margin-right: 5px; width: 50px;";
                for (let type of attrTypes) {
                    let typeOption = document.createElement("option");
                    typeOption.value = type;
                    typeOption.text = type;
                    attrTypeInput.appendChild(typeOption);
                }
                attrTypeInput.value = this.attributes[i].type;
                attrTypeInput.onchange = this.selectChange;
                attrDiv.appendChild(attrTypeInput)

                // Creates the input box for the attributes name.
                let attrTitleInput = document.createElement("input");
                attrTitleInput.id = "attr_name_input_" + this.attributes[i].id;
                attrTitleInput.type = "text";
                attrTitleInput.style = "margin-top: 5px;  width: calc(100% - 55px);";
                attrTitleInput.required = true;
                attrTitleInput.value = this.attributes[i].name;
                attrTitleInput.oninput = this.onInput;
                attrDiv.appendChild(attrTitleInput);

                childElements.push(attrDiv);
            }

            // Creates the add attribute button.
            let addAttrBtn = document.createElement("a");
            addAttrBtn.id = "add_attr_button";
            addAttrBtn.className = "button";
            // Have to add double the border in margin-left to line up with other elements.
            addAttrBtn.style = "text-align: center; padding: 5px; margin-top: 20px; margin-left: 11px; border: 3px #283747 solid; font-size: 16px;";
            addAttrBtn.innerHTML = "&plus; Attribute";
            addAttrBtn.onclick = this.buttonClick;
            childElements.push(addAttrBtn);

            // Adds all child elements to the property menu.
            for (let elements of childElements) {
                this.propertyMenu.appendChild(elements);
            }

            // Creates the error section.
            this.generateErrorText();
            this.updateInputBoxFeedback();

            // Opens the menu if open is true.
            if (open === true) {
                this.openMenu();
            }
        }
    }

    // Sets the invalid shadows around the input and selection boxes for elements that are holding invalid values.
    updateInputBoxFeedback() {
        // Lazy way to reset the validity of the input boxes.
        let inputBoxes = document.getElementsByTagName("input");
        let selectBoxes = document.getElementsByTagName("select");
        for (let inputBox of inputBoxes) {
            inputBox.setCustomValidity("");
        }
        for (let selectBox of selectBoxes) {
            selectBox.setCustomValidity("");
        }

        // Sets the custom validity text and shadow on the input boxes linked to the error item and type.
        for (let errorItem of Object.keys(this.refObj.errors)) {
            for (let errorCat of Object.keys(this.refObj.errors[errorItem])) {
                if (errorItem.includes("table") && errorCat.includes("name")) {
                    let inputBox = document.getElementById("title_input");
                    inputBox.setCustomValidity(this.refObj.errors[errorItem][errorCat].errorMsg)
                } else if (errorItem.includes("attr_") && errorCat.includes("name")) {
                    let attrNo = this.getIDNo(errorItem);
                    let inputBox = document.getElementById("attr_name_input_" + attrNo);
                    inputBox.setCustomValidity(this.refObj.errors[errorItem][errorCat].errorMsg)
                } else if (errorItem.includes("attr_") && errorCat.includes("type")) {
                    let attrNo = this.getIDNo(errorItem);
                    let inputBox = document.getElementById("attr_type_input_" + attrNo);
                    inputBox.setCustomValidity(this.refObj.errors[errorItem][errorCat].errorMsg)
                }
            }
        }
    }
};
