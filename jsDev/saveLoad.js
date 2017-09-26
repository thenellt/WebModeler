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

function checkCompatibility(){
        console.log("checking for browser support...");
}

function loadFromFile(fileName){
        var reader = new FileReader();
        
        if(fileName.files && fileName.files[0]) {
                reader.onload = function (e) {
                        parseConfigFile(e.target.result);
                        console.log(e.target.result);
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
                Console.log("problem parsing loaded string");
                return;
        }
        
        animalDiffRate = loadedObject.animalDiffRate;
        animalGrowthRate = loadedObject.animalGrowthRate;
        killProb = loadedObject.killProb;
        HpHy = loadedObject.HpHy;
        encounterRate = loadedObject.encounterRate;
        carryCapacity = loadedObject.carryCapacity;
        years = loadedObject.years;
        simName = loadedObject.simName;
        huntRange = loadedObject.huntRange;
        
        //advanced settings
        theta = loadedObject.theta;
        lowColorCode = loadedObject.lowColorCode;
        highColorCode = loadedObject.highColorCode;
        diffusionSamples = loadedObject.diffusionSamples;
        
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

function saveSimToFile(saveTowns){
        var saveObject = generateConfigObject();
        
        //save populations
        if(saveTowns){
                console.log("adding populations to file");
        }

        var outputString = JSON.stringify(saveObject);
        var jsonBlob = new Blob([outputString], {type: "application/json"});
        saveAs(jsonBlob, simName + ".cfg");
}

function generateConfigObject(){
        var saveObject = {};
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

function generatePersistObject(saveTowns){
        var saveObject = generateConfigObject();
        var persistObject = {};
        
        persistObject.name = saveObject.simName;
        persistObject.created = rightNow().toLocaleString();
        persistObject.modified = saveObject.created;
        persistObject.config = JSON.stringify(saveObject);
        
        if(saveTowns){
                saveObject.towns = JSON.stringify(towns);
        }
        else{
                saveObject.towns = "";
        }
        
        return persistObject;
}

function updatePersistObject(persistObject, saveTowns){
        var saveObject = generateConfigObject();
        if(persistObject.name != saveObject.simName){
                persistObject.name = saveObject.simName;
        }
        
        persistObject.modified = rightNow().toLocaleString();
        persistObject.config = JSON.stringify(saveObject);
        
        if(saveTowns){
                saveObject.towns = JSON.stringify(towns);
        }
        
        return persistObject;
}

function getPersistObjects(){
        var numEntries = localStorage.getItem('numEntries');
        
        if(numEntries === null){
                console.log("no persistent entries found");
                return null;
        }
        
        var entries = [];
        for(var i = 0; i < numEntries; i++){
                var entry = localStorage.getItem('entry' + i);
                console.log("entry");
                entries.push(JSON.parse(entry));
        }
        
        return entries;
}

function setupPersistConfigs(){
        var entries = getPersistObjects();
        if(!entries){
                document.getElementById("persistMessage").innerHTML = "No existing saves found";
                return;
        }
        
        document.getElementById("persistMessage").innerHTML = "Found " + entries.length + " saved simulation(s).";
}

checkCompatibility();
setupPersistConfigs();