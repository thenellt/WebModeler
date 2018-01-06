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
        document.getElementById("floatLat").value = "";
        document.getElementById("floatLong").value = "";
        document.getElementById("floatPopName").value = "";
        document.getElementById("floatPop").value = "";
        document.getElementById("floatKill").value = "";
        document.getElementById("floatGrowth").value = "";
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
                var tempLat = document.getElementById("floatLat").value;
                var tempLong = document.getElementById("floatLong").value;
                var tempName = document.getElementById("floatPopName").value;
                var tempPop = document.getElementById("floatPop").value;
                var tempKill = document.getElementById("floatKill").value;
                var tempGrowth =  document.getElementById("floatGrowth").value;
                let tempDate = new Date();
                var tempId = tempDate.valueOf();
                //add the new population to model
                var tempRow = new uiRow(tempLong, tempLat, tempPop, tempKill, tempName,
                                        tempGrowth, tempId, true);
                addPopToMap(tempId, tempName, parseFloat(tempLong), parseFloat(tempLat));
                addEntry(tempRow);
        }

        $('#floatingPopEditor').modal('close');
}

function showPopUpdater(index){
        console.log("showing popeditor in update mode");
        $('#editorDeleteButton').css('display', 'inline');
        
        let village = uiData[index];
        currentId = village.id;
        document.getElementById("floatLat").value = village.lat;
        document.getElementById("floatLong").value = village.long;
        document.getElementById("floatPopName").value = village.name;
        document.getElementById("floatKill").value = village.killRate;
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
                        if(checkPopUpdater()){
                                closePopUpdater(2);
                        }
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

                var i;
                for(i = 0; i < uiData.length; i++){
                        if(uiData[i].id == currentId){
                                break;
                        }
                }

                if(tempName !== uiData[i].name || tempLat !== uiData[i].lat || tempLong !== uiData[i].long){
                        removePopFromMapById(currentId);
                        addPopToMap(currentId, tempName, tempLong, tempLat, popEditorMode === editorModes.YEARLY);
                }
                
                uiData[i].lat = tempLat;
                uiData[i].long = tempLong;
                uiData[i].name = tempName;
                uiData[i].killRate = tempKill;
                if(popEditorMode === editorModes.UPDATE){
                        uiData[i].population = tempPop;
                        uiData[i].growthRate = tempGrowth;
                }

                updateTableRow(i);
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
        if(isNaN(parseFloat(document.getElementById("floatLat").value, 10))){
                notifyMessage("Latitude is invalid", 2);
                $('#floatLat').focus();
                return false;
        }
        if(isNaN(parseFloat(document.getElementById("floatLong").value, 10))){
                notifyMessage("Longitude is invalid", 2);
                $('#floatLong').focus();
                return false;
        }
        if(document.getElementById("floatPopName").value.length === 0){
                notifyMessage("Population must have a name", 2);
                $('#floatPopName').focus();
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
        if(isNaN(parseFloat(document.getElementById("floatLat").value, 10))){
                notifyMessage("Latitude is invalid", 2);
                $('#floatLat').focus();
                return false;
        }
        if(isNaN(parseFloat(document.getElementById("floatLong").value, 10))){
                notifyMessage("Longitude is invalid", 2);
                $('#floatLong').focus();
                return false;
        }
        if(document.getElementById("floatPopName").value.length === 0){
                notifyMessage("Population must have a name", 2);
                $('#floatPopName').focus();
                return false;
        }
        if(isNaN(parseInt(document.getElementById("floatPop").value))){
                notifyMessage("Population must be a postive integer", 2);
                $('#floatPop').focus();
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
        map.updateSize();
}

function closeFullscreenViewer(){
        document.getElementById("resultsMapContainer").appendChild(document.getElementById("popMapDiv"));
        document.getElementById("viewControlsContainer").appendChild(document.getElementById("viewerControls"));

        $('#fullScreenMap').modal('close');
        map.updateSize();
}

function openYearlyEditor(id){
        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].id === id && uiData[i].type === "yearly"){
                        var data = uiData[i];
                        break;
                }
                if(i === uiData.length - 1){
                        console.log("#########Critital: YearlyEditor couldn't find " + id + " in uiData!");
                        return;
                }
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
                        let pos = -1;
                        for(let i = 0; i < uiData.length; i++){
                                if(uiData[i].id === yearlyEditorId && uiData[i].type === "yearly"){
                                        pos = i;
                                        break;
                                }
                                if(i === uiData.length - 1){
                                        console.log("#########Critital: YearlyEditor couldn't find " + id + " in uiData!");
                                        return;
                                }
                        }
                        
                        if(pos > -1){
                                uiData[pos].population = results;
                                checkYearlyTableEntry(pos);
                                $('#yearlyPopEditor').modal('close');
                                notifyMessage("Found " + results.length + " years of data", 3);
                        }
                }
        }
        else{
                $('#yearlyPopEditor').modal('close');
        }
}

function checkYearlyTableEntry(pos){
        let isGood = true;
        let rowData = uiData[pos];
        if(isNaN(parseFloat(rowData.lat))){
                console.log("check failed at lat: " + rowData.lat);
                isGood = false;
        }
        if(isNaN(parseFloat(rowData.long))){
                console.log("check failed at long");
                isGood = false;
        }
        if(!rowData.name || rowData.name.length === 0){
                console.log("check failed at name");
                isGood = false;
        }
        if(rowData.killRate && isNaN(parseFloat(rowData.killRate, 10)) && rowData.killRate.length > 0){
                console.log("check failed at killrate");
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
