const editorModes = {
        NEW: 0,
        UPDATE: 1,
        YEARLY: 2,
};
var popEditorMode = editorModes.NEW;
var yearlyEditorId = -1;

function popEditorPassthrough(mode){
        console.log("popEditorPassthrough. Mode: " + popEditorMode + " input: " + mode);
        if(popEditorMode == editorModes.NEW){
                closePopEditor(mode);
        }
        else{
                closePopUpdater(mode);
        }
}

function clearPopEditor(){
        document.getElementById("mapEditorExpPop").classList.remove('hide');
        document.getElementById("mapEditorExpGrowth").classList.remove('hide');
        document.getElementById("mapEditorYearlyPop").classList.add('hide');
        document.getElementById("floatLat").value = "";
        document.getElementById("floatLong").value = "";
        document.getElementById("floatPopName").value = "";
        document.getElementById("floatPop").value = "";
        document.getElementById("floatKill").value = "";
        document.getElementById("floatGrowth").value = "";
        document.getElementById("floatHPHY").value = "";
}

function showPopEditor(position){
        popEditorMode = editorModes.NEW;
        clearPopEditor();
        if(typeof position !== 'undefined'){
                document.getElementById("floatLat").value = position[1];
                document.getElementById("floatLong").value = position[0];
        }
        else{
                return;
        }
        
        popupEvntFunction = function(e){
                e = e || window.event;
                if(e.keyCode == 27){ //cancel and close if escape key
                        closePopEditor(1);
                }
                else if(e.keyCode == 13){
                        if(checkPopEditor()){
                                closePopEditor(0);
                        }
                }
        };

        window.addEventListener('keyup', popupEvntFunction);
        $('#floatingPopEditor').modal('open');
        $('#floatPopName').focus();
}

function closePopEditor(clear){
        if(!clear && !checkPopEditor()){
                return;
        }

        window.removeEventListener('keyup', popupEvntFunction);

        if(!clear){ //user hit add and parameters have been checked
                var tempLat = parseFloat(document.getElementById("floatLat").value);
                var tempLong = parseFloat(document.getElementById("floatLong").value);
                var tempName = document.getElementById("floatPopName").value;
                var tempPop = parseInt(document.getElementById("floatPop").value);
                var tempGrowth =  parseFloat(document.getElementById("floatGrowth").value);
                var tempKill = document.getElementById("floatKill").value;
                if(tempKill)
                        tempKill = parseFloat(tempKill)
                else
                        tempKill = "";
                let docHPHY = document.getElementById("floatHPHY").value;
                if(docHPHY)
                        var tempHPHY = parseFloat(docHPHY);
                else
                        var tempHPHY = "";
                let tempDate = new Date();
                var tempId = tempDate.valueOf();
                //add the new population to model
                var tempRow = new uiRow(tempLong, tempLat, tempPop, tempKill, tempName,
                                        tempGrowth, tempHPHY, tempId, true);
                addPopToMap(tempId, tempName, tempLong, tempLat);
                addEntry(tempRow);
        }

        $('#floatingPopEditor').modal('close');
}

function showPopUpdater(popID){
        console.log("showPopUpdater::showing popeditor in update mode");
        $('#editorDeleteButton').css('display', 'inline');
        
        let village = uiData[popID];
        currentId = village.id;
        document.getElementById("floatLat").value = village.lat;
        document.getElementById("floatLong").value = village.long;
        document.getElementById("floatPopName").value = village.name;
        document.getElementById("floatKill").value = village.killRate;
        document.getElementById("floatHPHY").value = village.HPHY;
        if(village.type === "exp"){
                document.getElementById("floatPop").value = village.population;
                document.getElementById("floatGrowth").value = village.growthRate;
                popEditorMode = editorModes.UPDATE;
        }
        else if(village.type === "yearly"){
                document.getElementById("mapEditorExpPop").classList.add('hide');
                document.getElementById("mapEditorExpGrowth").classList.add('hide');
                document.getElementById("mapEditorYearlyPop").classList.remove('hide');
                popEditorMode = editorModes.YEARLY;
        }

        popupEvntFunction = function(e){
                e = e || window.event;
                if(e.keyCode == 27){ //cancel and close if escape key
                        closePopEditor(1);
                }

                else if(e.keyCode == 13){
                        popEditorPassthrough(0);
                }
        };

        window.addEventListener('keyup', popupEvntFunction);
        $('#floatingPopEditor').modal('open');
        $('#floatPopUName').focus();
}

function closePopUpdater(input){ //0 - cancel, 1 - update village, 2 delete village
        if(input === 0){ //update village
                if((popEditorMode === editorModes.UPDATE && !checkPopEditor()) ||
                                (popEditorMode === editorModes.YEARLY && !checkPopYearlyMode())){
                        console.log("update pop failed check");
                        return;
                }
                var tempLat = document.getElementById("floatLat").value;
                var tempLong = document.getElementById("floatLong").value;
                var tempName = document.getElementById("floatPopName").value;
                var tempPop = document.getElementById("floatPop").value;
                var tempKill = document.getElementById("floatKill").value;
                var tempGrowth =  document.getElementById("floatGrowth").value;
                var tempHPHY =  document.getElementById("floatHPHY").value;

                let settlement = uiData[currentId];
                if(tempName !== settlement.name || tempLat !== settlement.lat || tempLong !== settlement.long){
                        removePopFromMapById(currentId);
                        addPopToMap(currentId, tempName, tempLong, tempLat, popEditorMode === editorModes.YEARLY);
                }
                
                settlement.lat = tempLat;
                settlement.long = tempLong;
                settlement.name = tempName;
                settlement.killRate = tempKill;
                settlement.HPHY = tempHPHY;
                console.log("closePopUpdater::HPHY " + tempHPHY);
                if(popEditorMode === editorModes.UPDATE){
                        settlement.population = tempPop;
                        settlement.growthRate = tempGrowth;
                }

                updateTableRow(currentId);
        }
        else if(input === 2){ //delete village
                removeRow('popTable', currentId);
        }

        window.removeEventListener('keyup', popupEvntFunction);
        $('#editorDeleteButton').css('display', 'none');
        $('#floatingPopEditor').modal('close');
        clearPopEditor();
}

function checkPopYearlyMode(){
        if(!checkAnyFloat(document.getElementById("floatLat").value, 10)){
                notifyMessage("Latitude is invalid", 2);
                $('#floatLat').focus();
                return false;
        }
        if(!checkAnyFloat(document.getElementById("floatLong").value, 10)){
                notifyMessage("Longitude is invalid", 2);
                $('#floatLong').focus();
                return false;
        }
        if(document.getElementById("floatPopName").value.length === 0){
                notifyMessage("Population must have a name", 2);
                $('#floatPopName').focus();
                return false;
        }
        let HPHYString = document.getElementById("floatHPHY").value;
        if(HPHYString && HPHYString.length && !checkInt(document.getElementById("floatHPHY").value, 1, Number.MAX_SAFE_INTEGER)){
                notifyMessage("HPHY must be a postive integer > 0", 2);
                $('#floatHPHY').focus();
                return false;
        }
        let killString = document.getElementById("floatKill").value;
        if(killString.length){
                let killValue = parseFloat(document.getElementById("floatKill").value, 10);
                if(isNaN(killValue) || killValue < 0 || killValue > 1){
                        notifyMessage("Kill rate must be between 0.0 and 1.0", 3);
                        $('#floatKill').focus();
                        return false;
                }
        }
        
        return true;
}

function checkPopEditor(){
        console.log("in checkPopEditor");
        if(!checkAnyFloat(document.getElementById("floatLat").value, 10)){
                notifyMessage("Latitude is invalid", 2);
                $('#floatLat').focus();
                return false;
        }
        if(!checkAnyFloat(document.getElementById("floatLong").value, 10)){
                notifyMessage("Longitude is invalid", 2);
                $('#floatLong').focus();
                return false;
        }
        if(document.getElementById("floatPopName").value.length === 0){
                notifyMessage("Population must have a name", 2);
                $('#floatPopName').focus();
                return false;
        }
        if(!checkInt(document.getElementById("floatPop").value, 1, Number.MAX_SAFE_INTEGER)){
                notifyMessage("Population must be a postive integer", 2);
                $('#floatPop').focus();
                return false;
        }
        let HPHYString = document.getElementById("floatHPHY").value;
        if(HPHYString && HPHYString.length && !checkInt(document.getElementById("floatHPHY").value, 1, Number.MAX_SAFE_INTEGER)){
                notifyMessage("HPHY must be a postive integer > 0", 2);
                $('#floatHPHY').focus();
                return false;
        }
        let killString = document.getElementById("floatKill").value;
        if(killString.length){
                let killValue = parseFloat(document.getElementById("floatKill").value, 10);
                if(isNaN(killValue) || killValue < 0 || killValue > 1){
                        notifyMessage("Kill rate must be between 0.0 and 1.0", 3);
                        $('#floatKill').focus();
                        return false;
                }
        }
        let growthValue = parseFloat(document.getElementById("floatGrowth").value, 10);
        if(isNaN(growthValue) || growthValue < 0){
                notifyMessage("Growth rate must be a positive decimal", 2);
                $('#floatGrowth').focus();
                return false;
        }

        return true;
}

function showAdvancedSettings(){
        advSettingsFnc = function(e){
                e = e || window.event;
                if(e.keyCode == 27){
                        closeAdvancedSettings(1);
                }
        };

        window.addEventListener('keyup', advSettingsFnc);
}

function closeAdvancedSettings(clear){
        if(clear){
                //TODO revert settings
        }
        
        window.removeEventListener('keyup', advSettingsFnc);
        $('#advancedSettings').modal('close');
}

function openFullscreenViewer(){
        document.getElementById("viewerMapContainer").appendChild(document.getElementById("popMapDiv"));
        document.getElementById("viewerControlsContainer").appendChild(document.getElementById("viewerControls"));
        $('#fullScreenMap').modal('open');
        $('#popMapDiv').css('height', $(window).height() * 0.7 + "px");
        map.updateSize();
}

function closeFullscreenViewer(){
        document.getElementById("resultsMapContainer").appendChild(document.getElementById("popMapDiv"));
        document.getElementById("viewControlsContainer").appendChild(document.getElementById("viewerControls"));

        $('#fullScreenMap').modal('close');
        $('#popMapDiv').css('height', '500px');
        map.updateSize();
}

function openYearlyEditor(id){
        let data = uiData[id];
        if(typeof(data) == "undefined"){
                console.log("#########Critital: YearlyEditor couldn't find " + id + " in uiData!");
                return;
        }
        
        var showName = "No Name";
        if(data.name && data.name.length > 0){
                showName = data.name;
        }
        document.getElementById('yearlyEditorTitle').innerHTML = "Edit Populations of <i>" + showName + "</i>";
        
        yearlyEditorId = id;
        var valueString = "";
        if(data.population){
                for(let i = 0; i < data.population.length; i++){
                        valueString += data.population[i].toString();
                        if(i !== data.population.length - 1){
                                valueString += ", ";
                        }
                }
        }
        document.getElementById('yearlyEditorInput').value = valueString;
        
        $('#yearlyPopEditor').modal('open');
        document.getElementById('yearlyEditorInput').focus();
}

function closeYearlyEditor(mode){
        if(mode === 'save'){
                let results = checkYearlyPops(document.getElementById('yearlyEditorInput').value);
                if(Array.isArray(results)){
                        if(!(yearlyEditorId in uiData)){
                                console.log("#########Critital: closeYearlyEditor::couldn't find " + yearlyEditorId + " in uiData!");
                                return;
                        }
                        
                        uiData[yearlyEditorId].population = results;
                        checkYearlyTableEntry(yearlyEditorId);
                        $('#yearlyPopEditor').modal('close');
                        notifyMessage("Found " + results.length + " years of data", 3);
                }
        } else {
                $('#yearlyPopEditor').modal('close');
        }
}

function checkYearlyTableEntry(popID){
        let isGood = true;
        let rowData = uiData[popID];
        if(isNaN(parseFloat(rowData.lat))){
                console.log("checkYearlyTableEntry::check failed at lat: " + rowData.lat);
                isGood = false;
        } else if(isNaN(parseFloat(rowData.long))){
                console.log("checkYearlyTableEntry::check failed at long");
                isGood = false;
        } else if(!rowData.name || rowData.name.length === 0){
                console.log("checkYearlyTableEntry::check failed at name");
                isGood = false;
        } else if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                console.log("checkYearlyTableEntry::check failed at killrate");
                isGood = false;
        }
        
        if(isGood && !rowData.valid){ //just became valid
                
        }
        else if(isGood && rowData.valid){ //update already valid entry
                
        }
        else if(!isGood && rowData.valid){ //no longer valid
                
        }
        else if(!isGood){ //wasn't valid and still isnt'
                
        }
}

//returns the count of valid data points, or false for invalid text
function checkYearlyPops(text){
        console.log("text type: " + typeof(text) + " text: " + text);
        var results = [];
        let splicedData = text.split(',');
        for(let i = 0; i < splicedData.length; i++){
                let data = splicedData[i].trim();
                if(checkInt(data, 0, Number.MAX_SAFE_INTEGER)){
                        results.push(parseInt(data));
                }
                else if(i === splicedData.length - 1 && data.length === 0){
                        break;
                }
                else{
                        notifyMessage("Please check value " + (i + 1), 4);
                        return false;
                }
        }
        
        if(results.length < 1){
                return false;
        }
        else{
                return results;
        }
}

//based on https://www.w3schools.com/howto/howto_js_draggable.asp
function makeDraggable(elmnt){
        var pos1 = 0, pos2 = 0;
        document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
      
        function dragMouseDown(e) {
                console.log("mouse done");
                e = e || window.event;
                e.stopPropagation();
                e.preventDefault();
                pos2 = e.clientX;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
        }
      
        function elementDrag(e) {
                e = e || window.event;
                e.stopPropagation();
                e.preventDefault();
                pos1 = pos2 - e.clientX;
                pos2 = e.clientX;
                elmnt.style.top = e.clientY + "px";
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
      
        function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
        }
}

//based on a stack overflow: https://stackoverflow.com/questions/27840222/how-can-i-load-the-contents-of-a-small-text-file-into-a-javascript-var-wo-jquery
function readLocalFile(url, type, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
                callback(this.responseText);
        };
        xhr.open(type, url);
        xhr.send();
}

readLocalFile("./changelog.txt", 'GET', function(responseText) {
        var splitLog = responseText.split("\n");

        var list = document.createElement('ul');
        list.className = "collection";

        for(let i = 0; i < splitLog.length - 1; i++){
                var content = splitLog[i].split('-');

                var item = document.createElement('li');
                item.className = "collection-item";

                var title = document.createElement('span');
                title.className = "title";
                title.appendChild(document.createTextNode(content[0].slice(0, -1)));

                var innerText = document.createElement('p');
                innerText.appendChild(document.createTextNode(content[1].slice(0, -3)));

                item.appendChild(title);
                item.appendChild(innerText);

                list.appendChild(item);
        }

        document.getElementById('changeLogEntries').appendChild(list);
});
