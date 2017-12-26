/* global simData*/

var appCache = window.applicationCache;
var persistCompatibility = false;

function checkCompatibility(){
        console.log("checking for browser support...");
        document.getElementById("javascriptError").style.display = "none";
        document.getElementById('getStarted').classList.remove("hide");
        persistCompatibility = true;
}

//based on: https://www.html5rocks.com/en/tutorials/appcache/beginner/
appCache.addEventListener('updateready', updateApp, false);

function updateApp(){
        console.log("update app triggered");
        modalDialog('Application Update', 'An update to the app is avaliable, the page will now reload to finish the update.', function(){
                window.location.reload();
        });
}

function loadFromFile(fileName){
        var reader = new FileReader();

        if(fileName.files && fileName.files[0]) {
                reader.onload = function (e) {
                        let loadedObject = parseConfigFile(e.target.result);
                        if(loadedObject.valid){
                                if(typeof simData.simID === 'undefined' || simData.simID === -1){
                                        loadSimConfig(loadedObject);
                                        newSimulation();
                                        document.getElementById("popSetupTab").disabled = false;
                                        synchPersisObject();
                                        return;
                                }
                                let title = "Load Simulation";
                                let msg = "There is a currently active simulation. Loading a new simulation will overwrite all data from the current one.";
                                modalConfirmation(title, msg, function(){
                                        resetSimulation();
                                        loadSimConfig(loadedObject);
                                        newSimulation();
                                        document.getElementById("popSetupTab").disabled = false;
                                        synchPersisObject();
                                });
                        }
                        
                        //TODO fix reset file select
                        let loadButton = $('#loadConfigFileButton');
                        loadButton.replaceWith(loadButton.val('').clone(true));
                };
                reader.readAsText(fileName.files[0]);
        }
        
        let fileLoaderCopy = $('#loadConfigFileButton').clone();
        $('#loadConfigFileButton').remove();
        $('#getStarted').append(fileLoaderCopy);
}

function parseConfigFile(fileString){
        var loadedObject = {};
        try{
               loadedObject = JSON.parse(fileString);
               loadedObject.valid = true;
        } catch (e) {
                let title = "Problem Loading File";
                let msg = "The system couldn't parse the supplied file as a valid simulation configuration. Please supply a correctly formatted file.";
                modalDialog(title, msg);
                loadedObject.valid = false;
        }

        return loadedObject;
}

function loadSimConfig(fileData){
        simData = {};
        let config = fileData.config;
        simData.simID = config.simID;
        simData.animalDiffRate = config.animalDiffRate;
        simData.animalGrowthRate = config.animalGrowthRate;
        simData.killProb = config.killProb;
        simData.HpHy = config.HpHy;
        simData.encounterRate = config.encounterRate;
        simData.carryCapacity = config.carryCapacity;
        simData.years = config.years;
        simData.simName = config.simName;
        simData.huntRange = config.huntRange;

        //advanced settings
        simData.theta = config.theta;
        simData.lowColorCode = config.lowColorCode;
        simData.highColorCode = config.highColorCode;
        simData.diffusionSamples = config.diffusionSamples;
        simData.opacity = config.opacity || 0.8;

        //support saves with old color formatting
        if(simData.lowColorCode[0] !== '#'){
                simData.lowColorCode = "#" + simData.lowColorCode;
        }
        if(simData.highColorCode[0] !== '#'){
                simData.highColorCode = "#" + simData.highColorCode;
        }

        emptyTable();
        for(let i = 0; i < config.popData.length; i++){
                console.log("Adding pop name: " + config.popData[i]);
                let temp = config.popData[i];
                let tempRow = new uiRow(temp.long, temp.lat, temp.population, temp.killRate,
                                        temp.name, temp.growthRate, temp.id, true);
                addPopToMap(temp.id, temp.name, parseFloat(temp.long), parseFloat(temp.lat));
                addEntry(tempRow);
        }

        document.getElementById("paramYears").value = simData.years;
        document.getElementById("paramCarry").value = simData.carryCapacity;
        document.getElementById("paramDifRate").value = simData.animalDiffRate;
        document.getElementById("paramGrowthRate").value = simData.animalGrowthRate;
        document.getElementById("paramEncounterRate").value = simData.encounterRate;
        document.getElementById("paramKillProb").value = simData.killProb;
        document.getElementById("paramHphy").value = simData.HpHy;
        document.getElementById("rangeHphy").value = simData.huntRange;
        document.getElementById("paramName").value = simData.simName;

        document.getElementById("paramTheta").value = simData.theta;
        document.getElementById("paramLowColor").value = simData.lowColorCode;
        document.getElementById("paramHighColor").value = simData.highColorCode;
        document.getElementById("diffSamples").value = simData.diffusionSamples;
        document.getElementById("imgOpacity").value = simData.opacity;
}

function saveSimToFile(){
        var saveObject = generateConfigObject();

        var outputString = JSON.stringify(saveObject);
        var jsonBlob = new Blob([outputString], {type: "application/json"});
        saveAs(jsonBlob, simData.simName + ".cfg");
}

function savePersistConfig(persistID){
        let entry = findConfig(persistID);
        if(entry){
                var outputString = JSON.stringify(entry);
                var jsonBlob = new Blob([outputString], {type: "application/json"});
                saveAs(jsonBlob, entry.name + ".cfg");
        }
}

function findConfig(persistID){
        let entries = getPersistObjects();
        var pos = -1;
        if(entries.length){
                for(let i = 0; i < entries.length; i++){
                        if(entries[i].id == persistID){
                                return entries[i];
                        }
                }
        }
        
        return false;
}

function generateConfigObject(){
        var saveObject = {};
        saveObject.simID = simData.simID;
        saveObject.simName = simData.simName;
        saveObject.animalDiffRate = simData.animalDiffRate;
        saveObject.animalGrowthRate = simData.animalGrowthRate;
        saveObject.killProb = simData.killProb;
        saveObject.HpHy = simData.HpHy;
        saveObject.encounterRate = simData.encounterRate;
        saveObject.huntRange = simData.huntRange;
        saveObject.theta = simData.theta;
        saveObject.carryCapacity = simData.carryCapacity;
        saveObject.years = simData.years;
        saveObject.diffusionSamples = simData.diffusionSamples;
        saveObject.lowColorCode = simData.lowColorCode;
        saveObject.highColorCode = simData.highColorCode;
        saveObject.opacity = simData.opacity;
        saveObject.popData = [];

        for(let i = 0; i < uiData.length; i++){
                //console.log(uiData[i].valid);
                //console.log(JSON.stringify(uiData[i]));
                //if(uiData[i].valid){
                        saveObject.popData.push(uiData[i]);
                //}
        }

        console.log("found " + saveObject.popData.length + " valid populations");
        return saveObject;
}

function saveImgToFile(type){
        if(type){ //with map background
                map.once('postcompose', function(event) {
                        var tempCanvas = event.context.canvas;

                        tempCanvas.toBlob(function(blob) {
                                saveAs(blob, simData.simName + '_map.png');
                        });
                });
                map.renderSync();
        }
        else{
                canvas.toBlob(function(blob) {
                        saveAs(blob, simData.simName + '_heatmap.png');
                });
        }
}

function generatePersistObject(){
        var saveObject = generateConfigObject();
        var persistObject = {};

        persistObject.id = simData.simID;
        persistObject.name = saveObject.simName;
        persistObject.created = new Date();
        persistObject.modified = persistObject.created;
        persistObject.config = saveObject;

        return persistObject;
}

function synchPersisObject(){
        var saveObject = generatePersistObject();
        var currentSaves = getPersistObjects();
        var pos = -1;
        if(currentSaves){
                for(let i = 0; i < currentSaves.length; i++){
                        if(currentSaves[i].id == simData.simID){
                                pos = i;
                                break;
                        }
                }
        }

        if(pos > -1){
                saveObject.created = currentSaves[pos].created;
                localStorage.setItem('entry' + pos, JSON.stringify(saveObject));
                notifyMessage("Project autosave updated", 3);
        }
        else{
                var numEntries = parseInt(localStorage.getItem('numEntries'));
                localStorage.setItem('entry' + numEntries, JSON.stringify(saveObject));
                localStorage.setItem('numEntries', numEntries + 1);
                notifyMessage("Project autosave created", 5);
        }
}

function quickSave(){
        setupSimDefaults();
        readUserParameters();
        synchPersisObject();
        populatePersistSaves();
}

function getPersistObjects(){
        var numEntries = localStorage.getItem('numEntries');

        if(numEntries === null || parseInt(numEntries) === 0){
                console.log("no persistent entries found");
                return null;
        }
        numEntries = parseInt(numEntries);

        var entries = [];
        for(var i = 0; i < numEntries; i++){
                var entry = JSON.parse(localStorage.getItem('entry' + i));
                entries.push(entry);
        }

        return entries;
}

function setupPersistConfigs(){
        var entries = localStorage.getItem('numEntries');
        let container = document.getElementById("persistSaveContainer");

        if(!entries || entries == 0){
                document.getElementById("persistMessage").innerHTML = "No recent saves found";
                localStorage.setItem('numEntries', 0);
                container.className += " hide";
        }
        else{
                document.getElementById("persistMessage").innerHTML = "Found " + parseInt(entries) + " saved simulation(s).";
                container.classList.remove("hide");
        }
}

function deleteConfigByID(persistID){
        let entries = getPersistObjects();
        var pos = -1;
        if(entries.length){
                for(let i = 0; i < entries.length; i++){
                        if(entries[i].id == persistID){
                                pos = i;
                                break;
                        }
                }
        }
        if(pos !== -1){
                var numEntries = parseInt(localStorage.getItem('numEntries'));
                localStorage.removeItem('entry' + pos);
                localStorage.setItem('numEntries', (numEntries - 1));
                if(numEntries > 1 || pos !== (numEntries - 1)){
                        localStorage.removeItem('entry' + (numEntries - 1))
                        localStorage.setItem('entry' + pos, JSON.stringify(entries[numEntries - 1]));
                }

                var saveContainer = document.getElementById("persistSaveContainer");
                while (saveContainer.firstChild) {
                        saveContainer.removeChild(saveContainer.firstChild);
                }

                setupPersistConfigs();
                populatePersistSaves();
                console.log("persist config deleted with id: " + persistID);
        }
}

function buildHTMLSaveEntry(entry){
        var containerDiv = document.createElement('li');
        containerDiv.id = entry.id;
        
        var topRowContainer = document.createElement('div');
        topRowContainer.className = "collapsible-header";
        topRowContainer.style.cssText = "padding: 2px 2px 0px 2px;";
        
        var topRow = document.createElement('div');
        topRow.className = "row";
        topRow.style.marginTop = "8px";
        topRow.style.marginBottom = "8px";
        
        var saveName = document.createElement('div');
        saveName.className = "col s4";
        var nameText = document.createElement('h5');
        nameText.innerHTML = entry.name;
        saveName.appendChild(nameText);
        
        var modifiedContainer = document.createElement('div');
        modifiedContainer.className = "col s4";
        var modified = new Date(entry.modified);
        modifiedContainer.innerHTML = "<strong> Modified: </strong>" + modified.toLocaleTimeString() + " " + modified.toLocaleDateString();
        
        var popContainer = document.createElement('div');
        popContainer.className = "col s2";
        popContainer.innerHTML = "Populations: " + entry.config.popData.length;

        var loadContainer = document.createElement('div');
        loadContainer.className = "col s2";
        var loadButton = document.createElement('a');
        //loadButton.style.marginLeft = "2px";
        loadButton.className = "waves-effect waves-light btn";
        loadButton.innerHTML = "Load";
        loadButton.onclick = function() {confirmConfigLoad(entry.id);};
        loadContainer.appendChild(loadButton);

        topRow.appendChild(saveName);
        topRow.appendChild(modifiedContainer);
        topRow.appendChild(popContainer);
        topRow.appendChild(loadContainer);
        
        topRowContainer.appendChild(topRow);

        var botRowContainer = document.createElement('div');
        botRowContainer.className = "collapsible-body";
        botRowContainer.style.cssText = "padding: 8px 2px 0px 2px;";

        var botRow = document.createElement('div');
        botRow.className = "row";
        botRow.style.cssText = "margin-bottom: 8px;";

        var createdContainer = document.createElement('div');
        createdContainer.className = "col s4";
        var created = new Date(entry.created);
        createdContainer.innerHTML = "<strong> Created: </strong>" + created.toLocaleTimeString() + " " + created.toLocaleDateString();
        
        var fileContainer = document.createElement('div');
        fileContainer.className = "col s4";
        var fileButton = document.createElement('a');
        fileButton.className = "waves-effect waves-light btn teal darken-3";
        fileButton.innerHTML = "Download Config";
        fileButton.onclick = function() {savePersistConfig(entry.id);};
        fileContainer.appendChild(fileButton);
        
        var deleteContainer = document.createElement('div');
        deleteContainer.className = "col s2";
        var deleteButton = document.createElement('a');
        deleteButton.className = "waves-effect waves-light btn red darken-2";
        deleteButton.innerHTML = "Delete";
        deleteButton.onclick = function() {confirmAutosaveDelete(entry.id);};
        deleteContainer.appendChild(deleteButton);
        
        var copyContainer = document.createElement('div');
        copyContainer.className = "col s2";
        var copyButton = document.createElement('a');
        copyButton.className = "waves-effect waves-light btn";
        copyButton.innerHTML = "Copy";
        copyButton.onclick = function() {copyConfigByID(entry.id);};
        copyContainer.appendChild(copyButton);

        botRow.appendChild(createdContainer);
        botRow.appendChild(fileContainer);
        botRow.appendChild(deleteContainer);
        botRow.appendChild(copyContainer);
        
        botRowContainer.appendChild(botRow);

        containerDiv.appendChild(topRowContainer);
        containerDiv.appendChild(botRowContainer);
        
        return containerDiv;
}

function confirmConfigLoad(id){
        if(typeof simData.simID === 'undefined' || simData.simID === -1){
                loadConfigByID(id);
                return;
        }
        
        let title = "Load Simulation Autosave";
        let msg = "An existing simulation has been detected. Loading an autosave will overwrite the current simulation.";
        
        modalConfirmation(title, msg, function(){
                loadConfigByID(id);
        });
}

function confirmAutosaveDelete(id){
        let title = "Delete Autosave";
        let msg = "This will permanently delete all data associated with this simulation configuration.";
        
        modalConfirmation(title, msg, function(){
                deleteConfigByID(id);
        });
}

function loadConfigByID(persistID){
        let entry = findConfig(persistID);
        if(entry){
                resetSimulation();
                loadSimConfig(entry);
                addRow("popTable", -1);
                document.getElementById("popSetupTab").disabled = false;
                document.getElementById("parameterSetupTab").disabled = false;
                document.getElementById("resetButton").classList.remove("hide");
                document.getElementById("quickSaveButton").classList.remove("hide");
                document.getElementById("newSimButton").classList.add("hide");
                changeTab("parameterSetup");
                console.log("Persist config loaded with id: " + persistID);
        }
}

function copyConfigByID(persistID){
        let entry = findConfig(persistID);
        if(entry){
                let tempDate = new Date();
                let freshID = tempDate.valueOf();
                
                entry.modified = new Date();
                entry.config.simName = entry.config.simName + " Copy";
                entry.name = entry.config.simName;
                entry.config.simID = freshID;
                entry.id = freshID;
                
                let numEntries = parseInt(localStorage.getItem('numEntries'));
                localStorage.setItem('entry' + numEntries, JSON.stringify(entry));
                localStorage.setItem('numEntries', numEntries + 1);
                
                setupPersistConfigs();
                populatePersistSaves();
        }
}

function populatePersistSaves(){
        var saveContainer = document.getElementById("persistSaveContainer");
        while (saveContainer.firstChild){
                        saveContainer.removeChild(saveContainer.firstChild);
        }
        var saves = getPersistObjects();
        if(saves && saves.length > 1){
                saves.sort(function (a, b) {
                        return a.modified - b.modified;
                });
                saves.reverse();
        }

        if(saves){
                for(let i = 0; i < saves.length; i++){
                        let element = buildHTMLSaveEntry(saves[i]);
                        saveContainer.appendChild(element);
                }
                //$('#persistSaveContainer').collapsible('close');
                
                setTimeout(function(){
                        $('#persistSaveContainer').collapsible('open', 0);
                }, 100);
        }
}
