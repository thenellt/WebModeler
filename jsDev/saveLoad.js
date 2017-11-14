//save load system for parsing files and dealing with browser storage
/*
Goals
- Save parameters as json
- load text file with json
- browser persistent storage

*/

/* parameters to handle plus populations
var animalDiffRate;
var animalGrowthRate;
var killProb;
var HpHy;
var encounterRate;
var huntRange;
var theta;
var carryCapacity;
var years;
var diffusionSamples;

var lowColorCode;
var highColorCode;
*/

var appCache = window.applicationCache;

function checkCompatibility(){
        console.log("checking for browser support...");

        document.getElementById("javascriptError").style.display = "none";
}

//based on: https://www.html5rocks.com/en/tutorials/appcache/beginner/
appCache.addEventListener('updateready', updateApp, false);

function updateApp(){
        console.log("update app triggered");
        alert('An update to the app is avaliable, the page will now reload.');
        window.location.reload();
}

function loadFromFile(fileName){
        //TODO add warning dialog that current changes will be lost
        //TODO how to reset file select elements
        resetSimulation();
        var reader = new FileReader();

        if(fileName.files && fileName.files[0]) {
                reader.onload = function (e) {
                        parseConfigFile(e.target.result);
                        newSimulation();
                };
                reader.readAsText(fileName.files[0]);
        }
}

function parseConfigFile(fileString){
        var loadedObject = {};
        try{
               loadedObject = JSON.parse(fileString);
        } catch (e) {
                //TODO add error dialog
                Console.log("problem parsing loaded string");
                return;
        }

        loadSimConfig(loadedObject);
}

function loadSimConfig(config){
        changeToPopulations();
        simID = config.simID;
        animalDiffRate = config.animalDiffRate;
        animalGrowthRate = config.animalGrowthRate;
        killProb = config.killProb;
        HpHy = config.HpHy;
        encounterRate = config.encounterRate;
        carryCapacity = config.carryCapacity;
        years = config.years;
        simName = config.simName;
        huntRange = config.huntRange;

        //advanced settings
        theta = config.theta;
        lowColorCode = config.lowColorCode;
        highColorCode = config.highColorCode;
        diffusionSamples = config.diffusionSamples;

        for(let i = 0; i < config.popData.length; i++){
                let temp = config.popData[i];
                let tempRow = new uiRow(temp.long, temp.lat, temp.population, temp.killRate,
                                        temp.name, temp.growthRate, temp.id, true);
                addPopToMap(temp.id, temp.name, parseFloat(temp.long), parseFloat(temp.lat));
                addEntry(tempRow);
        }

        //add the default empty row
        addRow("popTable");

        document.getElementById("paramYears").value = years;
        document.getElementById("paramCarry").value = carryCapacity;
        document.getElementById("paramDifRate").value = animalDiffRate;
        document.getElementById("paramGrowthRate").value = animalGrowthRate;
        document.getElementById("paramEncounterRate").value = encounterRate;
        document.getElementById("paramKillProb").value = killProb;
        document.getElementById("paramHphy").value = HpHy;
        document.getElementById("rangeHphy").value = huntRange;
        document.getElementById("paramName").value = simName;

        document.getElementById("paramTheta").value = theta;
        document.getElementById("paramLowColor").value = lowColorCode;
        document.getElementById("paramHighColor").value = highColorCode;
        document.getElementById("diffSamples").value = diffusionSamples;
}

function saveSimToFile(){
        var saveObject = generateConfigObject();

        var outputString = JSON.stringify(saveObject);
        var jsonBlob = new Blob([outputString], {type: "application/json"});
        saveAs(jsonBlob, simName + ".cfg");
}

function generateConfigObject(){
        var saveObject = {};
        saveObject.simID = simID;
        saveObject.simName = simName;
        saveObject.animalDiffRate = animalDiffRate;
        saveObject.animalGrowthRate = animalGrowthRate;
        saveObject.killProb = killProb;
        saveObject.HpHy = HpHy;
        saveObject.encounterRate = encounterRate;
        saveObject.huntRange = huntRange;
        saveObject.theta = theta;
        saveObject.carryCapacity = carryCapacity;
        saveObject.years = years;
        saveObject.diffusionSamples = diffusionSamples;
        saveObject.lowColorCode = lowColorCode;
        saveObject.highColorCode = highColorCode;
        saveObject.popData = uiData;

        return saveObject;
}

function saveImgToFile(type){
        if(type){ //with map background
                map.once('postcompose', function(event) {
                        var tempCanvas = event.context.canvas;

                        tempCanvas.toBlob(function(blob) {
                                saveAs(blob, simName + '_map.png');
                        });
                });
                map.renderSync();
        }
        else{
                canvas.toBlob(function(blob) {
                        saveAs(blob, simName + '_heatmap.png');
                });
        }
}

function generatePersistObject(){
        var saveObject = generateConfigObject();
        var persistObject = {};

        persistObject.id = simID;
        persistObject.name = saveObject.simName;
        persistObject.created = new Date();
        persistObject.modified = persistObject.created;
        persistObject.config = saveObject;

        return persistObject;
}

function synchPersisObject(){
        var saveObject = generatePersistObject();
        var currentSaves = getPersistObjects();
        var i = -1;
        if(currentSaves){
                console.log("currentSave length: " + currentSaves.length);
                for(i = 0; i < currentSaves.length; i++){
                        console.log("currenSave id: " + currentSaves.id + " simId: " + simID);
                        if(currentSaves[i].id == simID){
                                break;
                        }
                }
        }

        if(i > -1){
                //TODO check this logic
                saveObject.created = currentSaves[i].created;
                localStorage.setItem('entry' + i, JSON.stringify(saveObject));
        }
        else{
                var numEntries = parseInt(localStorage.getItem('numEntries'));
                localStorage.setItem('entry' + numEntries, JSON.stringify(saveObject));
                localStorage.setItem('numEntries', numEntries + 1);
        }
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
                console.log(entry);
                entries.push(entry);
        }

        return entries;
}

function setupPersistConfigs(){
        var entries = localStorage.getItem('numEntries');
        console.log(entries);
        if(!entries || entries == 0){
                document.getElementById("persistMessage").innerHTML = "No recent saves found";
                localStorage.setItem('numEntries', 0);
                
                let container = document.getElementById("persistSaveContainer");
                container.className += " hide";
                
                let controls = document.getElementById("persistDisplay");
                controls.className += " hide";
        }
        else{
                document.getElementById("persistMessage").innerHTML = "Found " + parseInt(entries) + " saved simulation(s).";
        }
}

//persist test function
function loadMostRecentConfig(){
        console.log("load most recent config");
        var entries = getPersistObjects();
        for(let i = 0; i < entries.length; i++){
                console.log(entries[i]);
        }

        loadSimConfig(entries[entries.length - 1].config);
        document.getElementById("parameterSetupTab").disabled = false;
        document.getElementById("resetButton").classList.remove("hide");
        document.getElementById("newSimButton").innerHTML = "Continue";
        //changeTab("parameterSetup");
}

//persist test function
function deleteLastConfig(){
        console.log("delete last persist called");
        var numEntries = parseInt(localStorage.getItem('numEntries'));
        if(numEntries > 0){
                localStorage.setItem('numEntries', parseInt(numEntries) - 1);
                localStorage.removeItem('entry' + numEntries - 1);
        }
}

function buildHTMLSaveEntry(entry){
        var containerDiv = document.createElement('div');
        containerDiv.className = "row persistSave";
        containerDiv.id = entry.id;
        
        var topRow = document.createElement('div');
        topRow.className = "row";
        var saveName = document.createElement('div');
        saveName.className = "col s4 saveName";
        var nameText = document.createElement('h5');
        nameText.innerHTML = entry.name;
        saveName.appendChild(nameText);
        var deleteContainer = document.createElement('div');
        deleteContainer.className = "col s2 offset-s2 saveButton";
        var copyContainer = document.createElement('div');
        copyContainer.className = "col s2 saveButton";
        var loadContainer = document.createElement('div');
        loadContainer.className = "col s2 saveButton";
        
        var deleteButton = document.createElement('a');
        deleteButton.className = "waves-effect waves-light btn red darken-2";
        deleteButton.innerHTML = "Delete";
        deleteButton.onclick = function() { deleteSaveEntry(entry.id);};
        deleteContainer.appendChild(deleteButton);
        
        var copyButton = document.createElement('a');
        copyButton.className = "waves-effect waves-light btn";
        copyButton.innerHTML = "Copy";
        copyButton.onclick = function() { newFromEntry(entry.id);};
        copyContainer.appendChild(copyButton);
        
        var loadButton = document.createElement('a');
        loadButton.className = "waves-effect waves-light btn";
        loadButton.innerHTML = "Load";
        loadButton.onclick = function() { loadConfigByID(entry.id);};
        loadContainer.appendChild(loadButton);
        
        topRow.appendChild(saveName);
        topRow.appendChild(deleteContainer);
        topRow.appendChild(copyContainer);
        topRow.appendChild(loadContainer);
        
        var botRow = document.createElement('div');
        botRow.className = "row";
        var createdContainer = document.createElement('div');
        createdContainer.className = "col s3";
        var created = new Date(entry.created);
        createdContainer.innerHTML = "<strong> Created: </strong>" + created.toLocaleTimeString() + " " + created.toLocaleDateString();
        
        var modifiedContainer = document.createElement('div');
        modifiedContainer.className = "col s3";
        var modified = new Date(entry.modified);
        modifiedContainer.innerHTML = "<strong> Modified: </strong>" + modified.toLocaleTimeString() + " " + modified.toLocaleDateString();
        
        var popContainer = document.createElement('div');
        popContainer.className = "col s3";
        popContainer.innerHTML = "<strong> Populations: </strong>" + entry.config.popData.length;
        
        botRow.appendChild(createdContainer);
        botRow.appendChild(modifiedContainer);
        botRow.appendChild(popContainer);
        
        var divider = document.createElement('div');
        divider.className = "divider";
        divider.style.marginBottom = "2px";
        
        containerDiv.appendChild(topRow);
        containerDiv.appendChild(botRow);
        containerDiv.appendChild(divider);
        
        return containerDiv;
}

function testLoadConfig(){
        var saveContainer = document.getElementById("persistSaveContainer");
        var saves = getPersistObjects();
        
        if(saves){
                for(let i = 0; i < saves.length; i++){
                        let element = buildHTMLSaveEntry(saves[0]);
                        saveContainer.appendChild(element);
                }
        }
}

checkCompatibility();
setupPersistConfigs();
testLoadConfig();