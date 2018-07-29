var popEditorID;
var popEditorType;
var popEditorTempPopulation;
var yearlyEditorId = -1;
var advSettingsBackup;
var advSettingsFnc;

function togglePopEditorMode(isExp){
        $('#editorToggleYearly, #editorToggleExp').prop('checked', isExp);
        if(isExp){
                popEditorType = 'exp';
                document.getElementById("mapEditorExpPop").classList.remove('hide');
                document.getElementById("mapEditorExpGrowth").classList.remove('hide');
                document.getElementById("mapEditorYearlyPop").classList.add('hide');
        } else {
                popEditorType = 'yearly';
                document.getElementById("mapEditorExpPop").classList.add('hide');
                document.getElementById("mapEditorExpGrowth").classList.add('hide');
                document.getElementById("mapEditorYearlyPop").classList.remove('hide');
                if(!popEditorID)
                        popEditorTempPopulation = [];
                else
                        uiData[popEditorID].population = [];
        }
}

function clearPopEditor(position){
        popEditorID = false;
        popEditorType = 'exp';
        $('#editorToggleYearly, #editorToggleExp').prop('checked', true);
        document.getElementById("mapEditorExpPop").classList.remove('hide');
        document.getElementById("mapEditorExpGrowth").classList.remove('hide');
        document.getElementById("mapEditorYearlyPop").classList.add('hide');
        document.getElementById("floatLat").value = position[1];
        document.getElementById("floatLong").value = position[0];
        document.getElementById("floatPopName").value = "";
        document.getElementById("floatPop").value = "";
        document.getElementById("floatKill").value = "";
        document.getElementById("floatGrowth").value = "";
        document.getElementById("floatHPHY").value = "";
}

function populatePopEditor(popID){
        let village = uiData[popID];
        popEditorID = village.id;
        document.getElementById("floatLat").value = village.lat;
        document.getElementById("floatLong").value = village.long;
        document.getElementById("floatPopName").value = village.name;
        document.getElementById("floatKill").value = village.killRate;
        document.getElementById("floatHPHY").value = village.HPHY;
        if(village.type === "exp"){
                popEditorType = 'exp';
                $('#editorToggleYearly, #editorToggleExp').prop('checked', true);
                document.getElementById("mapEditorExpPop").classList.remove('hide');
                document.getElementById("mapEditorExpGrowth").classList.remove('hide');
                document.getElementById("mapEditorYearlyPop").classList.add('hide');
                document.getElementById("floatPop").value = village.population;
                document.getElementById("floatGrowth").value = village.growthRate;
        } else if(village.type === "yearly") {
                popEditorType = 'yearly';
                $('#editorToggleYearly, #editorToggleExp').prop('checked', false);
                document.getElementById("mapEditorExpPop").classList.add('hide');
                document.getElementById("mapEditorExpGrowth").classList.add('hide');
                document.getElementById("mapEditorYearlyPop").classList.remove('hide');
                document.getElementById("floatPop").value = "";
                document.getElementById("floatGrowth").value = "";
        }
}

function showPopEditor(position, existingPopID){
        popEditorTempPopulation = "";
        if(existingPopID){
                populatePopEditor(existingPopID)
        } else if(typeof position !== 'undefined' && position) {
                clearPopEditor(position);
        } else {
                return;
        }
        
        popupEvntFunction = function(e){
                e = e || window.event;
                if(e.keyCode == 27){
                        closePopEditor(1);
                }
                else if(e.keyCode == 13){
                        closePopEditor(0);
                }
        };

        window.addEventListener('keyup', popupEvntFunction);
        $('#floatingPopEditor').modal('open');
        $('#floatPopName').focus();
}

function closePopEditor(closeMode){ //0 save, 1 cancel, 2 delete
        if(closeMode === 2) {
                if(popEditorID)
                        removeRow('popTable', popEditorID);
        } else if(closeMode === 0){ 
                if((popEditorType === 'exp' && !checkPopEditor()) ||
                   (popEditorType === 'yearly' && !checkPopYearlyMode()))
                        return;
                
                let tempLat = parseFloat(document.getElementById("floatLat").value);
                let tempLong = parseFloat(document.getElementById("floatLong").value);
                let tempName = document.getElementById("floatPopName").value;
                let tempPop = parseInt(document.getElementById("floatPop").value);
                let tempGrowth =  parseFloat(document.getElementById("floatGrowth").value);
                let killValue = document.getElementById("floatKill").value;
                let tempKill = killValue ? parseFloat(killValue) : "";
                let docHPHY = document.getElementById("floatHPHY").value;
                let tempHPHY = docHPHY ? parseFloat(docHPHY) : "";

                if(popEditorID){
                        let settlement = uiData[popEditorID];
                        if(tempName !== settlement.name || tempLat !== settlement.lat || 
                           tempLong !== settlement.long || popEditorType !== settlement.type){
                                settlement.type = popEditorType;
                                removePopFromMapById(popEditorID);
                                addPopToMap(popEditorID, tempName, tempLong, tempLat, popEditorType === 'yearly');
                        }
                        settlement.lat = tempLat;
                        settlement.long = tempLong;
                        settlement.name = tempName;
                        settlement.killRate = tempKill;
                        settlement.HPHY = tempHPHY;
                        if(popEditorType === 'exp'){
                                settlement.population = tempPop;
                                settlement.growthRate = tempGrowth;
                        }
                        updateTableRow(popEditorID);
                } else {
                        let tempDate = new Date();
                        let tempId = tempDate.valueOf();
                        if(popEditorTempPopulation)
                                tempPop = popEditorTempPopulation;
                        let tempRow = new uiRow(tempLong, tempLat, tempPop, tempKill, tempName,
                                                tempGrowth, tempHPHY, tempId, popEditorType, true);
                        addPopToMap(tempId, tempName, tempLong, tempLat, popEditorType === 'yearly');
                        if(popEditorType === 'exp'){
                                addRow(tempRow);
                        } else {
                                addYearlyRow(tempRow);
                        }
                }
        }
        
        window.removeEventListener('keyup', popupEvntFunction);
        $('#floatingPopEditor').modal('close');
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
        if(isNaN(growthValue)){
                notifyMessage("Growth rate must be a decimal number", 2);
                $('#floatGrowth').focus();
                return false;
        }

        return true;
}

function openYearlyEditor(id){
        if(id === 'popEditor')
                id = popEditorID;
        let data = uiData[id];
        var showName = "No Name";
        if(typeof(data) !== "undefined"){
                if(data.name && data.name.length > 0)
                        showName = data.name;

                let valueString = "";
                if(data.population){
                        for(let i = 0; i < data.population.length; i++){
                                valueString += data.population[i].toString();
                                if(i !== data.population.length - 1)
                                        valueString += ", ";
                        }
                }
                document.getElementById('yearlyEditorInput').value = valueString;
        }
        
        yearlyEditorId = id;
        document.getElementById('yearlyEditorTitle').innerHTML = "Edit Populations of <i>" + showName + "</i>";
        $('#yearlyPopEditor').modal('open');
        document.getElementById('yearlyEditorInput').focus();
}

function closeYearlyEditor(mode){
        if(mode === 'save'){
                let results = checkYearlyPops(document.getElementById('yearlyEditorInput').value);
                if(Array.isArray(results)){
                        if(!yearlyEditorId){
                                popEditorTempPopulation = results;
                        } else {
                                uiData[yearlyEditorId].population = results;
                                if(checkYearlyRowData(uiData[yearlyEditorId])){
                                        $('#' + yearlyEditorId).addClass("validRow");
                                } else {
                                        $('#' + yearlyEditorId).removeClass("validRow");
                                }
                        }

                        notifyMessage("Found " + results.length + " years of data", 3);
                } else {
                        if(yearlyEditorId){
                                uiData[yearlyEditorId].population = [];
                                $('#' + yearlyEditorId).removeClass("validRow");
                        }
                        
                        notifyMessage("No valid data found", 3);
                }
        }

        $('#yearlyPopEditor').modal('close');
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
                } else if(i === splicedData.length - 1 && data.length === 0) {
                        break;
                } else {
                        notifyMessage("Please check value " + (i + 1), 4);
                        return false;
                }
        }
        
        if(results.length < 1){
                return false;
        } else {
                return results;
        }
}

function showAdvancedSettings(){
        advSettingsFnc = function(e){
                e = e || window.event;
                if(e.keyCode == 27){
                        closeAdvancedSettings(1);
                }
        };

        advSettingsBackup = {
                paramTheta: document.getElementById("paramTheta").value,
                paramLowColor: document.getElementById("paramLowColor").value,
                paramHighColor: document.getElementById("paramHighColor").value,
                diffSamples: document.getElementById("diffSamples").value,
                imgOpacity: document.getElementById("imgOpacity").value,
                boundryWidth: document.getElementById("boundryWidth").value
        }

        if(document.getElementById("enable3ColorMode").checked){
                advSettingsBackup.paramMidColor = document.getElementById("paramMidColor").value;
        } else {
                advSettingsBackup.paramMidColor = false;
        }

        window.addEventListener('keyup', advSettingsFnc);
}

function closeAdvancedSettings(clear){
        if(clear){
                document.getElementById("paramTheta").value = advSettingsBackup.paramTheta;
                document.getElementById("paramLowColor").value = advSettingsBackup.paramLowColor;
                document.getElementById("paramHighColor").value = advSettingsBackup.paramHighColor;
                document.getElementById("diffSamples").value = advSettingsBackup.diffSamples;
                document.getElementById("imgOpacity").value = advSettingsBackup.imgOpacity;
                document.getElementById("boundryWidth").value = advSettingsBackup.boundryWidth;
                if(advSettingsBackup.threeColorMode){
                        document.getElementById("enable3ColorMode").checked = true;
                        document.getElementById("midColorReset").classList.remove("disabled");
                        document.getElementById("paramMidColor").value = advSettingsBackup.threeColorMode;
                } else {
                        document.getElementById("enable3ColorMode").checked = false;
                        document.getElementById("paramMidColor").classList.add("disabled");
                        document.getElementById("midColorReset").classList.add("disabled");
                }
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

//based on: https://stackoverflow.com/questions/27840222/how-can-i-load-the-contents-of-a-small-text-file-into-a-javascript-var-wo-jquery
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
