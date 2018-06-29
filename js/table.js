var uiData = [];

function uiRow(long, lat, pop, kill, name, growth, hphy, id, validity){
        if(id === 0){
                let tempDate = new Date();
                this.id = tempDate.valueOf();
        }
        else{
                this.id = parseInt(id);
        }
        this.long = long;
        this.lat = lat;
        this.population = pop;
        this.killRate = kill;
        this.name = name;
        this.growthRate = growth;
        this.valid = validity;
        this.type = "exp";
        this.HPHY = hphy;
}

function uiYearlyRow(name, long, lat, yearlyPop, kill, hphy, id, validity){
        if(id === 0){
                let tempDate = new Date();
                this.id = tempDate.valueOf();
        }
        else{
                this.id = parseInt(id);
        }
        this.long = long;
        this.lat = lat;
        this.population = yearlyPop.slice();
        this.killRate = kill;
        this.name = name;
        this.valid = validity;
        this.type = "yearly";
        this.HPHY = hphy;
}

function isEmptyEntry(row){
        for(let i = 0; i < 6; i++){
                if(row.cells[i].innerHTML.trim().length)
                        return false;
        }

        return true;
}

//temp row is a uiRow object
function addEntry(tempRow){
        var table = document.getElementById("popTable");
        addRow("popTable", tempRow.id);
        var row = table.rows[table.rows.length - 1];

        row.cells[0].innerHTML = tempRow.name;
        row.cells[1].innerHTML = tempRow.long;
        row.cells[2].innerHTML = tempRow.lat;
        row.cells[3].innerHTML = tempRow.population;
        row.cells[4].innerHTML = tempRow.growthRate;
        row.cells[5].innerHTML = tempRow.killRate;
        row.cells[6].innerHTML = tempRow.HPHY;
        if(tempRow.valid){
                row.classList.add('validRow');
        }

        uiData[tempRow.id] = tempRow;
}

//data is optional uiYearlyData object
function addYearlyRow(data){
        let body = document.getElementById('popTableBody');
        var tempId;

        if(data){
                tempId = data.id;
        }
        else{
                let tempDate = new Date();
                tempId = tempDate.valueOf();
        }
        
        let newRow = document.createElement('tr');
        if(data && data.valid){
                newRow.classList.add("validRow");
        }
        newRow.type = "yearly";
        newRow.id = tempId;
        newRow.insertCell(-1).cellType = "name";
        newRow.insertCell(-1).cellType = "long";
        newRow.insertCell(-1).cellType = "lat";
        
        let popCell = newRow.insertCell(-1);
        let popButton = document.createElement('input');
        popButton.type = "button";
        popButton.className = "tableYearlyPopButton";
        popButton.value = "Edit Population";
        popButton.onclick = function() {openYearlyEditor(tempId);}
        popCell.append(popButton);
        popCell.colSpan = "2";
        
        newRow.insertCell(-1).cellType = "killRate";
        newRow.insertCell(-1).cellType = "HPHY";
        
        var deleteCell = newRow.insertCell(-1);
        var delButton = document.createElement('input');
        delButton.type = "button";
        delButton.className = "tableDelButton";
        delButton.value = "Delete";
        delButton.onclick = (function () {removeRow("popTable", tempId);});
        deleteCell.appendChild(delButton);
        
        newRow.cells[0].ondblclick = function() {cellClicked(this);};
        newRow.cells[1].ondblclick = function() {cellClicked(this);};
        newRow.cells[2].ondblclick = function() {cellClicked(this);};
        newRow.cells[4].ondblclick = function() {cellClicked(this);};
        newRow.cells[5].ondblclick = function() {cellClicked(this);};
        
        if(data){
                newRow.cells[0].innerHTML = data.name || "";
                newRow.cells[1].innerHTML = data.long || "";
                newRow.cells[2].innerHTML = data.lat || "";
                newRow.cells[4].innerHTML = data.killRate || "";
                newRow.cells[4].innerHTML = data.HPHY || "";
                uiData[data.id] = data;
        }
        else{
                var newRowData = new uiYearlyRow("", "", "", [], "", "", tempId, false);
                uiData[tempId] = newRowData;
        }
        
        document.getElementById('popTable').getElementsByTagName('tbody')[0].appendChild(newRow);
}

function addRow(tableId, rowId){
        //generate a new id or assign existing one
        let tempId = rowId;
        if(rowId === -1){
                let tempDate = new Date();
                tempId = tempDate.valueOf();
        }
        //add space for data storage
        var newRowData = new uiRow("", "", "", "", "", "", "", tempId, false);
        uiData[tempId] = newRowData;
        //build a new table row for DOM
        var table = document.getElementById(tableId);
        var body = table.getElementsByTagName('tbody')[0];
        var row = body.insertRow(table.rows.length - 1);
        row.id = tempId;
        row.insertCell(-1).cellType = "name";
        row.insertCell(-1).cellType = "long";
        row.insertCell(-1).cellType = "lat";
        row.insertCell(-1).cellType = "population";
        row.insertCell(-1).cellType = "growth";
        row.insertCell(-1).cellType = "killRate";
        row.insertCell(-1).cellType = "HPHY";
        var deleteCell = row.insertCell(-1);

        var delButton = document.createElement('input');
        delButton.type = "button";
        delButton.className = "tableDelButton";
        delButton.value = "Delete";
        delButton.onclick = (function () {removeRow(tableId, tempId);});
        deleteCell.appendChild(delButton);

        for(var i = 0; i < row.cells.length - 1; i++){
                row.cells[i].ondblclick = function() {
                        cellClicked(this);
                };
        }
}

function editFinished(cell, x, y, origValue){
        var input = cell.lastChild;
        var value = input.value;
        cell.removeChild(input);
        updateUIData(y, x, cell.cellType, value);
        if(value.length > 0){
                cell.innerHTML = value;
        }

        console.log("editFinished::finished at pos: " + x + ", " + y + " value: " + value);
}

function updateUIData(rowPos, cellPos, cellType, newValue){
        var tableRow = document.getElementById("popTable").rows[rowPos];
        let settlement = uiData[tableRow.id];

        switch(cellType){
                case "name": settlement.name = newValue;
                        break;
                case "long": settlement.long = newValue;
                        break;
                case "lat": settlement.lat = newValue;
                        break;
                case "population": settlement.population = newValue;
                        break;
                case "growth": settlement.growthRate = newValue;
                        break;
                case "killRate": settlement.killRate = newValue;
                        break;
                case "HPHY": settlement.HPHY = newValue;
                        break;
        }

        let status = (settlement.type === "exp") ? checkRowData(settlement, rowPos) : checkYearlyRowData(settlement, rowPos);
        if(status && !settlement.valid){ //data point has become complete -> add it to map and towns
                addPopToMap(settlement.id, settlement.name, parseFloat(settlement.long),
                            parseFloat(settlement.lat), settlement.type === "yearly");
                settlement.valid = true;
                $('#' + tableRow.id).addClass("validRow");
                console.log("updateUIData::row " + rowPos + " has become valid");
        } else if(status && settlement.valid && (cellPos < 3)) { //update map with name, lat, or long change
                removePopFromMapById(settlement.id);
                addPopToMap(settlement.id, settlement.name, parseFloat(settlement.long),
                            parseFloat(settlement.lat), settlement.type === "yearly");
        } else if(!status && settlement.valid) { //data point is no longer complete -> remove from map
                removePopFromMapById(settlement.id);
                settlement.valid = false;
                $('#' + tableRow.id).removeClass("validRow");
                console.log("updateUIData::row " + rowPos + " has become invalid");
        }
}

function checkRowData(rowData, rowPos){
        if(isNaN(parseFloat(rowData.lat))){
                console.log("checkRowData::failed at lat: " + rowData.lat);
                return false;
        } else if(isNaN(parseFloat(rowData.long))){
                console.log("checkRowData::failed at long");
                return false;
        } else if(rowData.name.length === 0){
                console.log("checkRowData::failed at name");
                return false;
        } else if(!checkInt(rowData.population, 0, Number.MAX_SAFE_INTEGER)){
                console.log("checkRowData::failed at pop");
                return false;
        } else if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                console.log("checkRowData::failed at killrate");
                return false;
        } else if(rowData.HPHY && isNaN(parseFloat(rowData.HPHY, 10)) && rowData.HPHY.length > 0){
                console.log("checkRowData::failed at killrate");
                return false;
        } else if(isNaN(parseFloat(rowData.growthRate, 10))){
                console.log("checkRowData::failed at growthrate");
                return false;
        }

        return true;
}

function checkYearlyRowData(rowData, rowPos){
        if(isNaN(parseFloat(rowData.lat))){
                console.log("checkYearlyRowData::failed at lat: " + rowData.lat);
                return false;
        } else if(isNaN(parseFloat(rowData.long))){
                console.log("checkYearlyRowData::failed at long");
                return false;
        } else if(rowData.name.length === 0){
                console.log("checkYearlyRowData::failed at name");
                return false;
        } else if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                console.log("checkYearlyRowData::failed at killrate");
                return false;
        } else if(rowData.HPHY && isNaN(parseFloat(rowData.HPHY, 10)) && rowData.HPHY.length > 0){
                console.log("checkYearlyRowData::failed at killrate");
                return false;
        } else if(rowData.populations < 1){
                console.log("checkYearlyRowData::failed at population count");
                return false;
        }

        return true;
}

function checkKey(e){
        switch(e.keyCode){
        case 13: return 3;
        case  9: e.preventDefault();
                if(e.shiftKey){
                        return 2
                }
                else{
                        return 1;
                }
        default: return 0;
        }
}

//change clicked cell to edit mode
function cellClicked(cell){
        if(cell.parentNode.type === "yearly"){
                if(cell.cellIndex === 3){
                        return;
                }
        }
        var value = cell.innerHTML;
        cell.innerHTML = "";
        var input = document.createElement('input');
        input.value = value;

        input.addEventListener("dblclick", function(e){ //otherwise cellClicked fires twice
                if (e.stopPropagation)
                        e.stopPropagation();
                if (e.cancelBubble !== null)
                        e.cancelBubble = true;
        });
        input.addEventListener("blur", function(){
                editFinished(cell, cell.cellIndex, cell.parentNode.rowIndex, value);
        });
        input.addEventListener('keydown',function(e){
                let check = checkKey(e);
                if(!check){ //not a key we care about
                        return;
                }

                if(check === 3){ //enter
                        this.blur();
                } else if(check === 1){ //tab
                        this.blur();
                        if(cell.parentNode.type === "yearly"){
                                if(cell.cellIndex === 2){
                                        cellClicked(cell.parentNode.children[4]);
                                } else if(cell.cellIndex === 5){
                                        return;
                                } else{
                                        cellClicked(cell.nextElementSibling);
                                }
                        } else if(cell.cellIndex != 6){
                                cellClicked(cell.nextElementSibling);
                        } else{
                                var nextRow = cell.parentNode.nextElementSibling;
                                if(!nextRow){
                                        addRow("popTable", -1);
                                        nextRow = cell.parentNode.nextElementSibling;
                                }

                                cellClicked(nextRow.firstChild);
                        }
                } else if(check === 2){ //shift+tab
                        this.blur();
                        if(cell.parentNode.type === "yearly" && cell.cellIndex === 4){
                                cellClicked(cell.parentNode.children[2]);
                        } else if(cell.cellIndex !== 0){
                                cellClicked(cell.previousElementSibling);
                        } else{
                                var prevRow = cell.parentNode.previousElementSibling;
                                if(prevRow){
                                        cellClicked(prevRow.lastChild.previousElementSibling);
                                }
                        }
                }
        });

        cell.appendChild(input);
        input.focus();
}

function emptyTable(){
        console.log("emptyTable::clearing table");
        var table = document.getElementById("popTableBody");
        table.innerHTML = '';
        uiData = {};
}

function removeRow(tableId, rowId){
        var table = document.getElementById(tableId);
        for(let i = 1; i < table.rows.length; i++){
                let row = table.rows[i];
                if(!row.id.localeCompare(rowId)){
                        table.deleteRow(i);
                        break;
                }
        }
        //remove from map and ui storage
        removePopFromMapById(rowId);
        delete uiData[rowId];
}

//assumes uiData has been updated already
function updateTableRow(popID){
        console.log("updateTableRow::data id: " + popID + " HPHY: " + uiData[popID].HPHY);
        var table = document.getElementById("popTable");
        var villageData = uiData[popID];
        var row = -1;
        for(var i = 0; i < table.rows.length; i++){
                if(table.rows[i].id == villageData.id){
                        row = table.rows[i];
                        break;
                }
        }

        if(row == -1){
                console.log("########## Critical: updateTableRow::couldn't find html table row");
                return;
        }

        row.cells[0].innerHTML = villageData.name;
        row.cells[1].innerHTML = villageData.long;
        row.cells[2].innerHTML = villageData.lat;
        if(villageData.type === "exp"){
                row.cells[3].innerHTML = villageData.population;
                row.cells[4].innerHTML = villageData.growthRate;
                row.cells[5].innerHTML = villageData.killRate;
                row.cells[6].innerHTML = villageData.HPHY;
        }
        else{
                row.cells[4].innerHTML = villageData.killRate;
                row.cells[5].innerHTML = villageData.HPHY;
        }
}