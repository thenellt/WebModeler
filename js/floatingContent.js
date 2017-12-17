editorModes = {
        NEW: 0,
        UPDATE: 1,
};
var popEditorMode = editorModes.NEW;

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
        popEditorMode = editorModes.UPDATE;
        $('#editorDeleteButton').css('display', 'inline');
        
        let village = uiData[index];
        currentId = village.id;
        document.getElementById("floatLat").value = village.lat;
        document.getElementById("floatLong").value = village.long;
        document.getElementById("floatPopName").value = village.name;
        document.getElementById("floatPop").value = village.population;
        document.getElementById("floatKill").value = village.killRate;
        document.getElementById("floatGrowth").value = village.growthRate;

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
        if(input === 1 && !checkPopEditor()){ //trying to update but something wasn't valid
                return;
        }

        window.removeEventListener('keyup', popupEvntFunction);

        if(input === 1){ //update village
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

                if(tempName !== uiData[i].name){
                        var features = source.getFeatures();
                        for(let x = 0; x < features.length; x++){
                                if(features[x].get('description') == uiData[i].id){
                                        features[x].set('description', tempName);
                                        break;
                                }
                        }
                }

                uiData[i].lat = tempLat;
                uiData[i].long = tempLong;
                uiData[i].name = tempName;
                uiData[i].population = tempPop;
                uiData[i].killRate = tempKill;
                uiData[i].growthRate = tempGrowth;

                updateTableRow(i);
        }
        else if(input === 2){ //delete village
                for(let x = 0; x < uiData.length; x++){
                        if(uiData[x].id == currentId){
                                uiData.splice(x, 1);
                                break;
                        }
                }

                removePopFromMapById(currentId);
                deleteTableRowById(currentId);
        }

        $('#editorDeleteButton').css('display', 'none');
        $('#floatingPopEditor').modal('close');
        clearPopEditor();
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
        let killValue = parseFloat(document.getElementById("floatKill").value, 10);
        if(isNaN(killValue) || killValue < 0 || killValue > 1){
                notifyMessage("Kill rate must be between 0.0 and 1.0", 3);
                $('#floatKill').focus();
                return false;
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
                
        }
        else if(!clear && !checkAdvancedSettings()){ //tried to save invalid settings
                return;
        }
        
        window.removeEventListener('keyup', advSettingsFnc);
        $('#advancedSettings').modal('close');
}

function checkAdvancedSettings(){
        //TODO advanced settings check
        return true;
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

