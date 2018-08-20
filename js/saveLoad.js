function checkCompatibility(){
        let compatible = true;
        let serviceWorkerSupport = false;
        if ('serviceWorker' in navigator)
                serviceWorkerSupport = true;
        if(typeof(Worker) == "undefined") //web workers
                compatible = false;
        let testVar = 'test';
        try {                           //local storage
                localStorage.setItem(testVar, testVar);
                localStorage.removeItem(testVar);
        } catch(e) {
                compatible = false;
        }

        if(compatible && serviceWorkerSupport){
                setupServiceWorker();
        } else if(compatible) {
                initApp(false);
                setupMapping();
        } else {
                let title = "Unsupported Browser";
                let msg = "Your browser lacks support for critical javascript features used by WebModeler. <br>";
                msg += "Please update your browser to the lastest version of Firefox, Edge, Chrome/Chromium, or Safari for best support."
                $('#coverScreen').modal('close');
                modalDialog(title, msg);
        }
}

function setupServiceWorker(){
        if(navigator.serviceWorker.controller){
                checkForUpdates();
                setupMapping();
        } else {
                navigator.serviceWorker.register('../serviceWorker.js').then(function (registration) {
                        console.log('ServiceWorker registration successful ');
                        window.location.reload();
                        registration.addEventListener('updatefound', function () {
                                var activeWorker = registration.installing;
                                activeWorker.addEventListener('statechange', function(e) {
                                        if(e.currentTarget.state === "activated"){
                                                console.log("active event");
                                                window.location.reload();
                                        }
                                });
                        });
                }).catch(function (error) {
                        console.log('Service worker registration failed:', error);
                });
        }
}

function checkForUpdates(){
        console.log("Service worker detected: requesting update check");
        readLocalFile("./manifest.json", 'GET', function(responseText) {
                let object = JSON.parse(responseText);
                var responseChannel = new MessageChannel();
                responseChannel.port1.onmessage = function(event){
                        if(event.data === "noUpdate"){
                                initApp(true);
                        } else if(event.data === "update"){
                                console.log("updateFound");
                                window.location.reload();
                        } else if(event.data === "error"){
                                console.log("there was a problem fetching updates");
                                initApp(true);
                        }
                };
                navigator.serviceWorker.controller.postMessage({request:"checkUpdate",version:object.version}, [responseChannel.port2]);
        });
}

function loadFromFile(fileName){
        var reader = new FileReader();

        if(fileName.files && fileName.files[0]) {
                reader.onload = function (e) {
                        let loadedObject = parseConfigFile(e.target.result);
                        if(loadedObject.valid){
                                addConfigFromFile(loadedObject);
                                return;
                        }
                };
                reader.readAsText(fileName.files[0]);
        }
        
        $('#loadConfigFileForm').trigger('reset');
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

function addConfigFromFile(fileData){
        let config = fileData.config;
        let test = findConfig(config.simID);
        if(test){
                let title = "Overwrite Conflicting Save?";
                let msg = "The save being loaded, <i>" + config.simName + "</i> has the same ID as the internal config named <i>" + test.name + "</i>.";
                msg += "<br><br>Select <b>OK</b> to overwrite the internal config with the config from the file.";
                msg += "<br>Select <b>CANCEL</b> to give the config being loaded a new ID.";
        
                modalConfirmation(title, msg, function(){
                        deleteConfigByID(config.simID);
                        synchPersisObject(config);
                        populatePersistSaves();
                        setupPersistConfigs();
                }, function(){
                        var tempDate = new Date();
                        config.simID = tempDate.valueOf();
                        synchPersisObject(config);
                        populatePersistSaves();
                        setupPersistConfigs();
                });
        } else {
                synchPersisObject(config);
                populatePersistSaves();
                setupPersistConfigs();
        }
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
        simData.opacity = config.opacity || 1.0;
        simData.threeColorMode = config.threeColorMode;
        if(simData.threeColorMode)
                simData.midColorCode = config.midColorCode;

        //support older save files
        if(simData.lowColorCode[0] !== '#'){
                simData.lowColorCode = "#" + simData.lowColorCode;
        }
        if(simData.highColorCode[0] !== '#'){
                simData.highColorCode = "#" + simData.highColorCode;
        }
        simData.boundryWidth = config.hasOwnProperty('boundryWidth') ? config.boundryWidth : 10;
        
        loadPopulationData(config.popData);

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
        document.getElementById("boundryWidth").value = simData.boundryWidth;
        if(simData.threeColorMode){
                document.getElementById("enable3ColorMode").checked = true;
                document.getElementById("midColorReset").classList.remove("disabled");
                document.getElementById("paramMidColor").value = simData.midColorCode;
        } else {
                document.getElementById("enable3ColorMode").checked = false;
                document.getElementById("paramMidColor").classList.add("disabled");
                document.getElementById("midColorReset").classList.add("disabled");
        }
}

function loadPopulationData(popData){
        for(let i = 0; i < popData.length; i++){
                let temp = popData[i];
                if(!temp.HPHY)
                        temp.HPHY = "";

                let tempRow = new uiRow(temp.long, temp.lat, temp.population, temp.killRate,
                        temp.name, temp.growthRate, temp.HPHY, temp.id, temp.type, temp.valid);
                if(temp.type === "exp"){
                        addRow(tempRow);
                } else {
                        addYearlyRow(tempRow);
                }

                if(temp.valid)
                        addPopToMap(temp.id, temp.name, parseFloat(temp.long), parseFloat(temp.lat), temp.type === "yearly");
        }
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
        let entry = JSON.parse(localStorage.getItem(persistID));
        if(entry)
                return entry;
        else
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
        saveObject.threeColorMode = simData.threeColorMode;
        if(simData.threeColorMode)
                saveObject.midColorCode = simData.midColorCode;
        saveObject.opacity = simData.opacity;
        saveObject.popData = [];
        saveObject.boundryWidth = simData.boundryWidth;

        for(settlement in uiData)
                saveObject.popData.push(uiData[settlement]);

        console.log("generateConfigObject found " + saveObject.popData.length + " populations");
        return saveObject;
}

function saveImgToFile(){
        map.once('postcompose', function(event) {
                event.context.canvas.toBlob(function(blob) {
                        saveAs(blob, simData.simName + '_year' + overlayYear + '_map.png');
                });
        });
        map.renderSync();
}

function saveHeatmapToFile(){
        const requestYear = overlayYear;
        const requestScale = document.getElementById('heatmapScale').value / 100;
        if(requestScale === 1){ 
                heatMapImages[requestYear].toBlob(function(blob) {
                        saveAs(blob, simData.simName + '_year' + requestYear + '_heatmap.png');
                });
        } else{
                workerThread.postMessage({type:'genImage', dest:'save', year:requestYear, scale:requestScale});
        }
}

function generatePersistObject(config){
        var saveObject = config ? config : generateConfigObject();
        var persistObject = {};

        persistObject.id = saveObject.simID;
        persistObject.name = saveObject.simName;
        persistObject.created = new Date();
        persistObject.modified = persistObject.created;
        persistObject.config = saveObject;

        return persistObject;
}

function synchPersisObject(config){
        var saveObject = config ? generatePersistObject(config) : generatePersistObject();
        let oldConfig = saveObject.id ? findConfig(saveObject.id) : false;

        if(!oldConfig){
                let entryIDs = JSON.parse(localStorage.getItem('entryIDs'));
                entryIDs.push(saveObject.id);
                localStorage.setItem('entryIDs', JSON.stringify(entryIDs));
                notifyMessage("Project autosave created", 3);
        } else{
                saveObject.created = oldConfig.created;
                notifyMessage("Project autosave updated", 3);
        }

        localStorage.setItem(saveObject.id, JSON.stringify(saveObject));
}

function quickSave(){
        setupSimDefaults();
        readUserParameters();
        synchPersisObject();
        populatePersistSaves();
        setupPersistConfigs();
}

function getPersistObjects(){
        var entryIDs = JSON.parse(localStorage.getItem('entryIDs'));

        if(!entryIDs || !entryIDs.length){
                console.log("getPersistObjects::no persistent entries found");
                return [];
        }

        var entries = [];
        for(item in entryIDs)
                entries.push(JSON.parse(localStorage.getItem(entryIDs[item])));

        return entries;
}

function setupPersistConfigs(){
        if(localStorage.getItem('numEntries'))
                updateLegacySaves();
        var entryIDs = JSON.parse(localStorage.getItem('entryIDs'));
        let container = document.getElementById("persistSaveContainer");

        if(!entryIDs || !entryIDs.length){
                document.getElementById("persistMessage").innerHTML = "No recent saves found";
                let testArray = new Array;
                localStorage.setItem('entryIDs', JSON.stringify(testArray));
                container.className += " hide";
        }
        else{
                document.getElementById("persistMessage").innerHTML = "Found " + entryIDs.length + " cached simulation(s).";
                container.classList.remove("hide");
        }
}

function deleteConfigByID(persistID){
        let entryIDs = JSON.parse(localStorage.getItem('entryIDs'));
        let index = entryIDs.indexOf(persistID);
        if(index != -1){
                localStorage.removeItem(entryIDs[index]);
                entryIDs.splice(index, 1);
                localStorage.setItem('entryIDs', JSON.stringify(entryIDs));
                console.log("deleteConfigByID::persist config deleted with id: " + persistID);
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
        nameText.style.margin = '8px 0px 8px 0px';
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
        createdContainer.style.marginTop = '8px';
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
                setupPersistConfigs();
                populatePersistSaves();
        });
}

function loadConfigByID(persistID){
        let entry = findConfig(persistID);
        if(entry){
                resetSimulation();
                loadSimConfig(entry);
                tabManager.enableTab(pageTabs.POPS);
                tabManager.enableTab(pageTabs.PARAMS);
                $('#tabFillerButton').removeClass('disabled');
                document.getElementById("resetButton").classList.remove("hide");
                document.getElementById("quickSaveButton").classList.remove("hide");
                document.getElementById("newSimButton").classList.add("hide");
                tabManager.changeTab(pageTabs.PARAMS, false);
                console.log("loadConfigByID::Persist config loaded with id: " + persistID);
        }
}

function copyConfigByID(persistID){
        let entry = findConfig(persistID);
        if(entry){
                let tempDate = new Date();
                entry.modified = tempDate;
                entry.config.simName = entry.config.simName + " Copy";
                entry.name = entry.config.simName;
                entry.config.simID = tempDate.valueOf();;
                entry.id = tempDate.valueOf();;
                
                let entryIDs = JSON.parse(localStorage.getItem('entryIDs'));
                entryIDs.push(entry.config.simID);
                localStorage.setItem('entryIDs', JSON.stringify(entryIDs));
                localStorage.setItem(entry.config.simID, JSON.stringify(entry));

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
        if(saves){
                if(saves.length > 1){
                        saves.sort(function (a, b) {
                                return Date.parse(a.modified) - Date.parse(b.modified);
                        });

                        saves.reverse();
                }

                for(let i = 0; i < saves.length; i++){
                        let element = buildHTMLSaveEntry(saves[i]);
                        saveContainer.appendChild(element);
                }
                
                setTimeout(function(){
                        $('#persistSaveContainer').collapsible('open', 0);
                }, 100);
        }
}

function loadPopsFromFile(filename){
        var reader = new FileReader();

        if(filename.files && filename.files[0]) {
                reader.onload = function (e) {
                        let jsonResult = getPopsFromConfig(e.target.result);
                        let csvResult = jsonResult || getPopsFromCSV(e.target.result);
                        if(!jsonResult && !csvResult){
                                const title = "Problem Loading File";
                                const msg = "Please make sure the file you are trying to load conforms to one of the three acceptable file formats.";
                                modalDialog(title, msg);
                        }
                        else{
                                let num = jsonResult ? jsonResult : csvResult;
                                notifyMessage("Loaded " + num + " populations", 3);
                        }
                };
                reader.readAsText(filename.files[0]);
        }
        
        $('#loadPopFileForm').trigger('reset');
}

function getPopsFromCSV(fileText){
        let fileLines = fileText.split(/\r?\n/);
        let validPops = 0;
        for(let i = 0; i < fileLines.length; i++){
                let splitLine = fileLines[i].split(",");
                console.log("line " + i + " had length: " + splitLine.length)
                for(let j = 0; j < splitLine.length; j++){
                        splitLine[j] = splitLine[j].trim();
                }
                
                if(!splitLine[6].length){
                        splitLine.pop();
                }
                
                if(splitLine.length === 6){
                        console.log("tyring to parse line " + i + " as a exp entry");
                        if(parseCSVExpEntry(splitLine)){validPops++;}
                }
                else if(splitLine.length > 6){
                        console.log("tyring to parse line " + i + " as a yearly entry");
                        if(parseCSVYearlyEntry(splitLine)){validPops++;};
                }
        }
        
        return validPops;
}

function parseCSVExpEntry(data){
        let tName = data[0].length > 0 ? data[0] : false;
        let tLat = checkFloat(data[1], -90.0, 90.0) ? parseFloat(data[1], 10) : false;
        let tLong = checkFloat(data[1], -180.0, 180.0) ? parseFloat(data[2], 10) : false;
        let tPop = checkInt(data[4], 1, Number.MAX_SAFE_INTEGER) ? parseInt(data[4]) : false;
        let tGrowth = checkFloat(data[5], -100.0, 100.0) ? parseFloat(data[5]) : false;
        let tKill = checkFloat(data[3], -1.0, 1.0) ? parseFloat(data[3]) : false;
        if(tKill === -1){
                tKill = "";
        }
        else if(tKill < 0){
                tKill = false;
        }
        
        if(tName && tLat && tLong && tPop && tGrowth && tKill){
                let tRow = new uiRow(tLong, tLat, tPop, tKill, tName, tGrowth, "", 0, 'exp', true);
                addRow(tRow);
                addPopToMap(tRow.id, tName, tLong, tLat, false);
                return true;
        }
        
        return false;
}

function parseCSVYearlyEntry(data){
        let tName = data[0].length > 0 ? data[0] : false;
        let tLat = checkFloat(data[1], -90.0, 90.0) ? parseFloat(data[1], 10) : false;
        let tLong = checkFloat(data[1], -180.0, 180.0) ? parseFloat(data[2], 10) : false;
        let tKill = checkFloat(data[3], -1.0, 1.0) ? parseFloat(data[3]) : false;
        if(tKill === -1){
                tKill = "";
        } else if(tKill < 0) {
                tKill = false;
        }

        var tPop = [];
        for(let i = 4; i < data.length; i++){
                if(checkInt(data[i], 1, Number.MAX_SAFE_INTEGER)){
                        tPop.push(parseInt(data[i]));
                } else {
                        tPop = false;
                        break;
                }
        }

        if(tPop.length < 3){
                tPop = false;
        }

        if(tName && tLat && tLong && tPop && tKill){
                let tRow = new uiRow(tLong, tLat, tPop, tKill, tName, "", "", 0, true);
                addYearlyRow(tRow);
                addPopToMap(tRow.id, tName, tLong, tLat, false);
                return true;
        }
        
        return false;
}

function getPopsFromConfig(fileText){
        try{
                let loadedObject = JSON.parse(fileText);
                let pdata = loadedObject.config.popData;
                if(pdata && pdata.length > 0){
                        for(let i = 0; i < pdata.length; i++){
                                //TODO prompt about rectifying this
                                pdata[i].id = 0;
                        }
                        loadPopulationData(pdata);
                        return pdata.length;
                }
                else{
                        console.log("no population data in config");
                        return 0;
                }
        } catch (e) {
                console.log("problem parsing file as json");
                return 0;
        }
}

function updateLegacySaves(){
        let numEntries = parseInt(localStorage.getItem('numEntries'));
        if(numEntries < 1 && !localStorage.getItem('entry0')){
                localStorage.removeItem('numEntries');
                return;
        }

        let newEntries = [];
        for(let i = 0; i <= numEntries; i++){
                let name = 'entry' + i;
                let temp = localStorage.getItem(name);
                if(temp){
                        let entry = JSON.parse(temp);
                        newEntries.push(entry.id);
                        localStorage.setItem(entry.id, JSON.stringify(entry));
                        localStorage.removeItem(name);
                }
        }

        let oldEntries = JSON.parse(localStorage.getItem('entryIDs'));
        if(!oldEntries || !oldEntries.length){
                localStorage.setItem('entryIDs', JSON.stringify(newEntries));
        } else{
                for(let j = 0; j < newEntries.length; j++)
                        oldEntries.push(newEntries[j]);
                localStorage.setItem('entryIDs', JSON.stringify(oldEntries));
        }

        localStorage.removeItem('numEntries');
}