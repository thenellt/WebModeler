var rowCounter = 0;

function removePopulation(id){
        for(var i = 0; i < populations.length; i++){
                if(populations[i].id === id){
                        populations.splice(i, 1);
                        break;
                }
        }
}

function populateTable(){
        
}

function addEntry(name, x, y, pop, growth, kill){
        addRow("popTable");
        var table = document.getElementById("popTable");
        console.log("table rows: " + table.rows.length);
        var row = table.rows[table.rows.length - 1];
        
        row.cells[0].innerHTML = name;
        row.cells[1].innerHTML = x;
        row.cells[2].innerHTML = y;
        row.cells[3].innerHTML = pop;
        row.cells[4].innerHTML = growth;
        row.cells[5].innerHTML = kill;
}

function addRow(tableId){
        console.log(tableId);
        var cellNum = 0;
        var rowId = "row" + rowCounter++;
        var table = document.getElementById(tableId);
        var body = table.getElementsByTagName('tbody')[0];
        var row = body.insertRow(table.rows.length - 1);
        row.id = rowId;
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
        delButton.onclick = (function () {deleteRow(tableId, rowId);});
        deleteCell.appendChild(delButton);
        
        for(var i = 0; i < row.cells.length; i++){
                row.cells[i].ondblclick =(function() {
                        cellClicked(this);
                });
        }
}

function editFinished(cell, x, y, origValue){
        console.log("edit finished: " + x + ", " + y);
        var input = cell.lastChild;
        var value = input.value;
        //TODO check value against origValue for sanity
        updateFromCell(y, x, value, origValue);
        cell.removeChild(input);
        cell.innerHTML = value;
        
        var table = document.getElementById("popTable");
        var row = table.rows[y];
        var name = row.cells[0].innerHTML;
}

function updateFromCell(row, cell, newValue, oldValue){
        var villageData;
        var features;
        var x;
        var tempPoint;
        var tempFeature;
        
        if(cell === 0){ //name was changed, update map view
                for(var j = 0; j < towns.length; j++){
                        if(towns[j].name == oldValue){
                                villageData = towns[j];
                                break;
                        }
                }
                features = source.getFeatures();
                for(x = 0; x < features.length; x++){
                        console.log(features[x].get('description'));
                        if(features[x].get('description') == oldValue){
                                features[x].set('description', newValue);
                                break;
                        }
                }
                
                villageData.name = newValue;
        }
        else{
                var vName = document.getElementById("popTable").rows[row].cells[0].innerHTML;
                for(var i = 0; i < towns.length; i++){
                        if(towns[i].name == vName){
                                villageData = towns[i];
                                break;
                        }
                }
                
                if(cell === 1){
                        villageData.long = newValue;
                        features = source.getFeatures();
        
                        for(x = 0; x < features.length; x++){
                                console.log(features[x].get('description'));
                                if(features[x].get('description') == villageData.name){
                                        source.removeFeature(features[x]);
                                        break;
                                }
                        }
                        
                        tempPoint = new ol.geom.Point(
                                [villageData.long, villageData.lat]
                        );
                        
                        tempFeature = new ol.Feature(tempPoint);
                        tempFeature.set('description', villageData.name);
                        tempFeature.setStyle(styleFunction);
                        source.addFeature(tempFeature);
                }
                else if(cell === 2){
                        villageData.lat = newValue;
                        features = source.getFeatures();
                        
                        for(x = 0; x < features.length; x++){
                                console.log(features[x].get('description'));
                                if(features[x].get('description') == villageData.name){
                                        source.removeFeature(features[x]);
                                        break;
                                }
                        }
                        
                        tempPoint = new ol.geom.Point(
                                [villageData.long, villageData.lat]
                        );
                        
                        tempFeature = new ol.Feature(tempPoint);
                        tempFeature.set('description', villageData.name);
                        tempFeature.setStyle(styleFunction);
                        source.addFeature(tempFeature);
                }
                else if(cell === 3){
                        villageData.population = newValue;
                }
                else if(cell === 4){
                        villageData.growthRate = newValue;
                }
                else if(cell === 5){
                        villageData.killRate = newValue;
                }
        }
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

function cellClicked(cell){
        console.log("Cell: " + cell.cellIndex + ", " + cell.parentNode.rowIndex);
        var value = cell.innerHTML;
        cell.innerHTML = "";
        var input = document.createElement('input');
        input.value = value;
        
        input.addEventListener("dblclick", function(e){
                //console.log("caught double click");
                if (e.stopPropagation)
                        e.stopPropagation();
                if (e.cancelBubble !== null)
                        e.cancelBubble = true;
        });
        input.addEventListener("blur", function(){
                //console.log("blur event listner fired");
                editFinished(cell, cell.cellIndex, cell.parentNode.rowIndex, value);
        });
        input.addEventListener('keydown',function(e){
                var check = checkKey(e);
                if(!check){
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
                                        console.log(addRow(cell.parentNode.parentNode.parentNode.id));
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

function printTable(tableId){
        var table = document.getElementById(tableId);
        for(var i = 0; i < table.rows.length; i++){
                var row = table.rows[i];
                var contents = "";
                for(var j = 0; j < table.rows[i].cells.length; j++){
                        contents += row.cells[j].innerHTML + ", ";
                }
                console.log(contents);
        }
}

function deleteRow(tableId, rowId){
        console.log("delete row called. table: " + tableId + " rowId: " + rowId);
        var table = document.getElementById(tableId);
        var row;
        var i;
        for(i = 0; i < table.rows.length; i++){
                row = table.rows[i];
                if(!row.id.localeCompare(rowId)){
                        break;
                }
        }
        
        var name = row.cells[0].innerHTML;
        console.log("pop name: " + name);
        
        //remove from point storage
        for(var k = 0; k < towns.length; k++){
                if(towns[k].name == name){
                        towns.splice(k, 1);
                        break;
                }
        }
        
        //remove population visual from map
        var features = source.getFeatures();
        
        for(var j = 0; j < features.length; j++){
                console.log(features[j].get('description'));
                if(features[j].get('description') == name){
                        source.removeFeature(features[j]);
                        break;
                }
        }
        
        //remove from table
        table.deleteRow(i);
}

function deleteRowByName(villageName){
        var table = document.getElementById("popTable");
        for(var i = 0; i < table.rows.length; i++){
                if(table.rows[i].cells[0].innerHTML == villageName){
                        table.deleteRow(i);
                        break;
                }
        }
}

function updateTableRow(origName, newName){
        var table = document.getElementById("popTable");
        var row;
        for(var i = 0; i < table.rows.length; i++){
                if(table.rows[i].cells[0].innerHTML == origName){
                        row = table.rows[i];
                        break;
                }
        }
        
        var villageData;
        for(var j = 0; j < towns.length; j++){
                if(towns[j].name == newName){
                        villageData = towns[j];
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

//addRow("popTable");