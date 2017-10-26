var uiData = [];

function uiRow(long, lat, pop, kill, name, growth, id, validity){
        if(id === 0){
                let tempDate = new Date();
                this.id = tempDate.valueOf();
        }
        else{
                this.id = id;
        }
        this.long = long;
        this.lat = lat;
        this.population = pop;
        this.killRate = kill;
        this.name = name;
        this.growthRate = growth;
        this.valid = validity;
        
}

//temp row is a uiRow object
function addEntry(tempRow){
        addRow("popTable");
        var table = document.getElementById("popTable");
        var row = table.rows[table.rows.length - 1];
        
        row.id = tempRow.id;
        row.cells[0].innerHTML = tempRow.name;
        row.cells[1].innerHTML = tempRow.long;
        row.cells[2].innerHTML = tempRow.lat;
        row.cells[3].innerHTML = tempRow.population;
        row.cells[4].innerHTML = tempRow.growthRate;
        row.cells[5].innerHTML = tempRow.killRate;
        
        uiData[uiData.length - 1] = tempRow;
}

function addRow(tableId){
        //generate a new id
        let tempDate = new Date();
        let tempId = tempDate.valueOf();
        //add space for data storage
        var newRowData = {};
        newRowData.valid = false;
        newRowData.id = tempId;
        uiData.push(newRowData);
        console.log("uiData length: " + uiData.length);
        //build a new table row for dom
        var cellNum = 0;
        var table = document.getElementById(tableId);
        var body = table.getElementsByTagName('tbody')[0];
        var row = body.insertRow(table.rows.length - 1);
        row.id = tempId;
        var nameCell = row.insertCell(cellNum++);
        var longCell = row.insertCell(cellNum++);
        var latCell = row.insertCell(cellNum++);
        var popCell = row.insertCell(cellNum++);
        var growthCell = row.insertCell(cellNum++);
        var killCell = row.insertCell(cellNum++);
        var deleteCell = row.insertCell(cellNum++);
        
        var delButton = document.createElement('input');
        delButton.type = "button";
        delButton.className = "tableDelButton";
        delButton.value = "Delete";
        delButton.onclick = (function () {removeRow(tableId, tempId);});
        deleteCell.appendChild(delButton);
        
        for(var i = 0; i < row.cells.length; i++){
                row.cells[i].ondblclick =(function() {
                        cellClicked(this);
                });
        }
}

function editFinished(cell, x, y, origValue){
        var input = cell.lastChild;
        var value = input.value;
        console.log("input.value is: " + input.value);
        //TODO check value against origValue for sanity
        cell.removeChild(input);
        updateUIData(y, x, value);
        if(value.length > 0){
                cell.innerHTML = value;
        }
        
        console.log("edit finished: " + x + ", " + y);
}

function updateUIData(row, cell, newValue){
        console.log("running updateUIData row: " + row);
        console.log("uiData length: " + uiData.length);
        var tableRow = document.getElementById("popTable").rows[row];
        var i;
        for(i = 0; i < uiData.length; i++){
                if(uiData[i].id == tableRow.id){
                        break;
                }
        }
        
        if(i === uiData.length){
                console.log("couldn't find row");
                return;
        }
        
        switch(cell){
                case 0: uiData[i].name = newValue;
                        break;
                case 1: uiData[i].long = newValue;
                        break;
                case 2: uiData[i].lat = newValue;
                        break;
                case 3: uiData[i].population = newValue;
                        break;
                case 4: uiData[i].growthRate = newValue;
                        break;
                case 5: uiData[i].killRate = newValue;
        }
        
        let status = checkRowData(i);
        if(status && !uiData[i].valid){
                //data point has become complete -> add it to map and towns
                addPopToMap(uiData[i].id, uiData[i].name, parseFloat(uiData[i].long),
                            parseFloat(uiData[i].lat));
                uiData[i].valid = true;
                console.log("row " + row + " has become valid");
        }
        else if(status && uiData[i].valid && (cell < 3)){ //update map
                //synchronize changes of complete data point with rest of system
                removePopFromMapById(uiData[i].id);
                addPopToMap(uiData[i].id, uiData[i].name, parseFloat(uiData[i].long),
                            parseFloat(uiData[i].lat));
        }
        else if(!status && uiData[i].valid){
                //data point is no longer complete -> remove from other locations
                removePopFromMapById(uiData[i].id);
                uiData.valid = false;
                console.log("row " + row + " has become invalid");
        }
}

//param is index from uiData array
function checkRowData(rowIndex){
        var rowData = uiData[rowIndex];
        if(isNaN(parseFloat(rowData.lat))){
                console.log("check failed at lat: " + rowData.lat);
                return false;
        }
        if(isNaN(parseFloat(rowData.long))){
                console.log("check failed at long");
                return false;
        }
        if(rowData.name.length === 0){
                console.log("check failed at name");
                return false;
        }
        if(isNaN(parseInt(rowData.population))){
                console.log("check failed at pop");
                return false;
        }
        if(isNaN(parseFloat(rowData.killRate, 10))){
                console.log("check failed at killrate");
                return false;
        }
        if(isNaN(parseFloat(rowData.growthRate, 10))){
                console.log("check failed at growthrate");
                return false;
        }
                
        return true;
}

function checkKey(e){
        //console.log("ran key check");
        switch(e.keyCode){
        case 13: return 3;
        case 9: e.preventDefault();
                if(e.shiftKey){
                        return 2
                }
                else{
                        return 1;
                }
                break;
        case 37: e.preventDefault();
                return 4;
        case 38: return 5;
        case 39: return 6;
        case 40: return 7;
        default: return 0;
        }
}

//change clicked cell to edit mode
function cellClicked(cell){
        console.log("Cell: " + cell.cellIndex + ", " + cell.parentNode.rowIndex);
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
                var check = checkKey(e);
                if(!check){ //not a key we care about
                        return;
                }
                
                if(check === 3){
                        this.blur();
                }
                else if(check === 1){
                        this.blur();
                        if(cell.cellIndex != 5){
                                cellClicked(cell.nextElementSibling);
                        }
                        else{
                                var nextRow = cell.parentNode.nextElementSibling;
                                if(!nextRow){
                                        addRow("popTable");
                                        nextRow = cell.parentNode.nextElementSibling;
                                }
                                
                                cellClicked(nextRow.firstChild);
                        }
                        
                }
                else if(check === 2){
                        this.blur();
                        if(cell.cellIndex !== 0){
                                cellClicked(cell.previousElementSibling);
                        }
                        else{
                                var prevRow = cell.parentNode.previousElementSibling;
                                if(prevRow){
                                        cellClicked(prevRow.lastChild.previousElementSibling);
                                }
                        }
                }
                else if(check === 4){ //left
                        if(cell.cellIndex !== 0){
                                this.blur();
                                cellClicked(cell.previousElementSibling);
                        }
                }
                else if(check === 5){ //up
                        var upRow = cell.parentNode.previousElementSibling;
                        if(upRow){
                                this.blur();
                                cellClicked(upRow.children[cell.cellIndex]);
                        }
                }
                else if(check === 6){ //right
                        if(cell.cellIndex != 5){
                                this.blur();
                                cellClicked(cell.nextElementSibling);
                        }
                }
                else if(check === 7){ //down
                        var downRow = cell.parentNode.nextElementSibling;
                        if(downRow){
                                this.blur();
                                cellClicked(downRow.children[cell.cellIndex]);
                        }
                }
        });
        
        cell.appendChild(input);
        input.focus();
}

function removeRow(tableId, rowId){
        console.log("delete row called. RowId: " + rowId);
        var table = document.getElementById(tableId);
        var tablePosition;
        for(let i = 0; i < table.rows.length; i++){
                let row = table.rows[i];
                if(!row.id.localeCompare(rowId)){
                        tablePosition = i;
                        break;
                }
        }
        
        //remove from ui and data storage
        for(let k = 0; k < uiData.length; k++){
                if(uiData[k].id === rowId){
                        if(uiData[k].valid){
                                removeRowData(rowId);
                        }
                        uiData.splice(k, 1);
                        break;
                }
        }
        
        //remove from table
        table.deleteRow(tablePosition);
}

function removeRowData(dataId){
        //remove population visual from map
        if(source){
                var features = source.getFeatures();
                
                for(var j = 0; j < features.length; j++){
                        console.log(features[j].get('description'));
                        if(features[j].get('description') == dataId){
                                source.removeFeature(features[j]);
                                break;
                        }
                }
        }
}

//assumes uiData has already been cleaned
function deleteTableRowById(rowId){
        var table = document.getElementById("popTable");
        for(var i = 0; i < table.rows.length; i++){
                if(table.rows[i].id == rowId){
                        table.deleteRow(i);
                        break;
                }
        }
}

//assumes uiData has been updated already
function updateTableRow(row){
        var table = document.getElementById("popTable");
        var villageData = uiData[row];
        var row;
        for(var i = 0; i < table.rows.length; i++){
                if(table.rows[i].id == villageData.id){
                        row = table.rows[i];
                        break;
                }
        }
        
        row.cells[0].innerHTML = villageData.name;
        row.cells[1].innerHTML = villageData.long;
        row.cells[2].innerHTML = villageData.lat;
        row.cells[3].innerHTML = villageData.population;
        row.cells[4].innerHTML = villageData.growthRate;
        row.cells[5].innerHTML = villageData.killRate;
}

//assumes validity has already been checked
function buildTownFromData(pos){
        let data = uiData[pos];
        let tempLong = parseFloat(data.long);
        let tempLat = parseFloat(data.lat);
        let tempPop = parseFloat(data.population);
        let tempKill = parseFloat(data.killRate);
        let tempGrowth = parseFloat(data.growthRate);
        
        let temp = new town(tempLong, tempLat, tempPop, tempKill,
                            data.name, tempGrowth, data.id);
        return temp;
}

//start the simulation with a clean row
addRow("popTable");