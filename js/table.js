/* global source */
var uiData = [];

function uiRow(long, lat, pop, kill, name, growth, id, validity){
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
}

function uiYearlyRow(name, long, lat, yearlyPop, kill, id, validity){
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
        var row = table.rows[table.rows.length - 1];
        if(isEmptyEntry(row)){
                console.log("last row was empty, using it");
                row.valid = true;
                for(let i = 0; i < uiData.length; i++){
                        if(uiData[i].id == row.id){
                                console.log("found emptry row in uiData");
                                uiData[i].id = row.id;
                                break;
                        }
                }
                row.id = tempRow.id;
        }
        else{
                console.log("last row wasn't empty, adding one");
                addRow("popTable", tempRow.id);
        }
        row = table.rows[table.rows.length - 1];

        row.cells[0].innerHTML = tempRow.name;
        row.cells[1].innerHTML = tempRow.long;
        row.cells[2].innerHTML = tempRow.lat;
        row.cells[3].innerHTML = tempRow.population;
        row.cells[4].innerHTML = tempRow.growthRate;
        row.cells[5].innerHTML = tempRow.killRate;
        if(tempRow.valid){
                row.classList.add('validRow');
        }

        uiData[uiData.length - 1] = tempRow;
}

//data is optional uiYearlyData object
function addYearlyRow(data){
        let body = document.getElementById('popTableBody');
        let lastRow = body.children[body.children.length - 1];
        if(isEmptyEntry(lastRow)){
                removeRow("popTable", lastRow.id);
        }
        
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
        
        if(data){
                newRow.cells[0].innerHTML = data.name || "";
                newRow.cells[1].innerHTML = data.long || "";
                newRow.cells[2].innerHTML = data.lat || "";
                newRow.cells[4].innerHTML = data.killRate || "";
                uiData.push(data);
        }
        else{
                var newRowData = new uiYearlyRow("", "", "", [], "", tempId, false);
                uiData.push(newRowData);
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
        var newRowData = new uiRow("", "", "", "", "", "", tempId, false);
        uiData.push(newRowData);
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
        var deleteCell = row.insertCell(-1);

        var delButton = document.createElement('input');
        delButton.type = "button";
        delButton.className = "tableDelButton";
        delButton.value = "Delete";
        delButton.onclick = (function () {removeRow(tableId, tempId);});
        deleteCell.appendChild(delButton);

        for(var i = 0; i < row.cells.length; i++){
                row.cells[i].ondblclick = function() {
                        cellClicked(this);
                };
        }
}

function editFinished(cell, x, y, origValue){
        console.log("cell type is: " + cell.cellType);
        var input = cell.lastChild;
        var value = input.value;
        //TODO check value against origValue for sanity
        cell.removeChild(input);
        updateUIData(y, x, cell.cellType, value);
        if(value.length > 0){
                cell.innerHTML = value;
        }

        console.log("edit finished at pos: " + x + ", " + y + " value: " + value);
}

function updateUIData(rowPos, cellPos, cellType, newValue){
        var tableRow = document.getElementById("popTable").rows[rowPos];
        console.log("running updateUIData row: " + rowPos + " id: " + tableRow.id);
        var i;
        for(i = 0; i < uiData.length; i++){
                if(uiData[i].id == tableRow.id){
                        break;
                }
        }

        if(i === uiData.length){
                console.log("######CRITICAL####### - couldn't find row");
                return;
        }

        switch(cellType){
                case "name": uiData[i].name = newValue;
                        break;
                case "long": uiData[i].long = newValue;
                        break;
                case "lat": uiData[i].lat = newValue;
                        break;
                case "population": uiData[i].population = newValue;
                        break;
                case "growth": uiData[i].growthRate = newValue;
                        break;
                case "killRate": uiData[i].killRate = newValue;
        }

        let status = (uiData[i].type === "exp") ? checkRowData(uiData[i], rowPos) : checkYearlyRowData(uiData[i], rowPos);
        if(status && !uiData[i].valid){ //data point has become complete -> add it to map and towns
                addPopToMap(uiData[i].id, uiData[i].name, parseFloat(uiData[i].long),
                            parseFloat(uiData[i].lat), uiData[i].type === "yearly");
                uiData[i].valid = true;
                $('#' + tableRow.id).addClass("validRow");
                console.log("row " + rowPos + " has become valid");
        }
        else if(status && uiData[i].valid && (cellPos < 3)){ //update map with name, lat, or long change
                removePopFromMapById(uiData[i].id);
                addPopToMap(uiData[i].id, uiData[i].name, parseFloat(uiData[i].long),
                            parseFloat(uiData[i].lat), uiData[i].type === "yearly");
        }
        else if(!status && uiData[i].valid){ //data point is no longer complete -> remove from map
                removePopFromMapById(uiData[i].id);
                uiData[i].valid = false;
                $('#' + tableRow.id).removeClass("validRow");
                console.log("row " + rowPos + " has become invalid");
        }
}

function checkRowData(rowData, rowPos){
        if(isNaN(parseFloat(rowData.lat))){
                //console.log("check failed at lat: " + rowData.lat);
                return false;
        }
        if(isNaN(parseFloat(rowData.long))){
                //console.log("check failed at long");
                return false;
        }
        if(rowData.name.length === 0){
                //console.log("check failed at name");
                return false;
        }
        if(!checkInt(rowData.population, 0, Number.MAX_SAFE_INTEGER)){
                //console.log("check failed at pop");
                return false;
        }
        if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                //console.log("check failed at killrate");
                return false;
        }
        if(isNaN(parseFloat(rowData.growthRate, 10))){
                //console.log("check failed at growthrate");
                return false;
        }

        return true;
}

function checkYearlyRowData(rowData, rowPos){
        if(isNaN(parseFloat(rowData.lat))){
                //console.log("check failed at lat: " + rowData.lat);
                return false;
        }
        if(isNaN(parseFloat(rowData.long))){
                //console.log("check failed at long");
                return false;
        }
        if(rowData.name.length === 0){
                //console.log("check failed at name");
                return false;
        }
        if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                //console.log("check failed at killrate");
                return false;
        }
        if(rowData.populations < 1){
                return false;
        }

        return true;
}

function checkKey(e){
        //console.log("ran key check");
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
        //console.log("Cell: " + cell.cellIndex + ", " + cell.parentNode.rowIndex + " id: " + cell.parentNode.id);
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
                }
                else if(check === 1){ //tab
                        this.blur();
                        if(cell.parentNode.type === "yearly"){
                                if(cell.cellIndex === 2){
                                        cellClicked(cell.parentNode.children[4]);
                                }
                                else if(cell.cellIndex === 4){
                                        return;
                                }
                                else{
                                        cellClicked(cell.nextElementSibling);
                                }
                        }
                        else if(cell.cellIndex != 5){
                                cellClicked(cell.nextElementSibling);
                        }
                        else{
                                var nextRow = cell.parentNode.nextElementSibling;
                                if(!nextRow){
                                        addRow("popTable", -1);
                                        nextRow = cell.parentNode.nextElementSibling;
                                }

                                cellClicked(nextRow.firstChild);
                        }

                }
                else if(check === 2){ //shift+tab
                        this.blur();
                        if(cell.parentNode.type === "yearly" && cell.cellIndex === 4){
                                cellClicked(cell.parentNode.children[2]);
                        }
                        else if(cell.cellIndex !== 0){
                                cellClicked(cell.previousElementSibling);
                        }
                        else{
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
        console.log("clearing table");
        var table = document.getElementById("popTableBody");
        table.innerHTML = '';
        uiData = [];
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
        for(let k = 0; k < uiData.length; k++){
                if(uiData[k].id === rowId){
                        if(uiData[k].valid){
                                removePopFromMapById(rowId);
                        }
                        uiData.splice(k, 1);
                        break;
                }
        }
}

//assumes uiData has been updated already
function updateTableRow(uiDataPosition){
        var table = document.getElementById("popTable");
        var villageData = uiData[uiDataPosition];
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
        row.cells[5].innerHTML = villageData.killRate;
        if(villageData.type === "exp"){
                row.cells[3].innerHTML = villageData.population;
                row.cells[4].innerHTML = villageData.growthRate;
        }
}