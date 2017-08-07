var tableData;
var rowCounter = 0;

function addPopulation(name, lat, long, pop, growth){
        var newTown;
        newTown.id = populations.length + 1;
        newTown.name = name;
        newTown.lat = lat,
        newTown.long = long;
        newTown.pop = pop;
        newTown.growth = growth;
        
        populations.push(newTown);
}

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

function addEntry(){
        
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
        var latCell = row.insertCell(cellNum++);
        var longCell = row.insertCell(cellNum++);
        var popCell = row.insertCell(cellNum++);
        var growthCell = row.insertCell(cellNum++);
        var killCell = row.insertCell(cellNum++);
        
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
        cell.removeChild(input);
        cell.innerHTML = value;
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
                                        cellClicked(prevRow.lastChild);
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

function deleteRow(tableID, rowId){
        
}

addRow("popTable");