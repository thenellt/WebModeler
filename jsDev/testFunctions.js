/* global ol features uiData simData simResults lowColorCode:true highColorCode:true*/

var workerThread;
var workerFunctions = {};

function setupSimDefaults(){
        simData.animalDiffRate = 0.1;
        simData.animalGrowthRate = 0.07;
        simData.killProb = 0.1;
        simData.HpHy = 40;
        simData.encounterRate = 0.02043;
        simData.carryCapacity = 25;
        simData.theta = 1;
        simData.years = 10;
        simData.diffusionSamples = 1;
        simData.huntRange = 5;
        simData.lowColorCode = "ffeda0";
        simData.highColorCode = "f03b20";
        simData.simName = "defaultName";
        simData.opacity = 0.8;
}

function readUserParameters(){
        simData.years = parseInt(document.getElementById("paramYears").value, 10) || simData.years;
        simData.carryCapacity = parseInt(document.getElementById("paramCarry").value, 10) || simData.carryCapacity;
        simData.animalDiffRate = parseFloat(document.getElementById("paramDifRate").value) || simData.animalDiffRate;
        simData.animalGrowthRate = parseFloat(document.getElementById("paramGrowthRate").value) || simData.animalGrowthRate;
        simData.encounterRate = parseFloat(document.getElementById("paramEncounterRate").value) || simData.encounterRate;
        simData.killProb = parseFloat(document.getElementById("paramKillProb").value) || simData.killProb;
        simData.HpHy = parseInt(document.getElementById("paramHphy").value, 10) || simData.HpHy;
        simData.huntRange = parseInt(document.getElementById("rangeHphy").value, 10) || 10;

        var tempLow = document.getElementById("paramLowColor").value;
        if(tempLow.length > 0){
                simData.lowColorCode = tempLow;
        }

        var tempHigh = document.getElementById("paramHighColor").value;
        if(tempHigh.length > 0){
                simData.highColorCode = tempHigh;
        }

        var tempName = document.getElementById("paramName").value;
        if(tempName.length > 0){
                simData.simName = tempName;
        }

        simData.theta = parseFloat(document.getElementById("paramTheta").value) || simData.theta;
        simData.diffusionSamples = parseInt(document.getElementById("diffSamples").value, 10) || simData.diffusionSamples;
        simData.opacity = parseFloat(document.getElementById("imgOpacity").value) || simData.opacity;

        console.log("readUserParameters::finished reading user input");
}

function setupTowns(){
        var townArray = [];

        if(!checkYearlyPopDuration()){
                return false;
        }

        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].valid){
                        townArray.push(sanitizeTownData(uiData[i]));
                }
        }

        if(!townArray.length){
                const title = "No Valid Populations Found";
                const msg = "Please enter at least one population before running the simulation.";
                modalDialog(title, msg);
                return false;
        }
        else{
                return townArray;
        }
}

function checkYearlyPopDuration(){
        var nameString = ""
        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].type === "yearly" && uiData[i].population.length < simData.years){
                        if(!nameString.length){
                                nameString = uiData[i].name;
                        }
                        else{
                                nameString += ", " + uiData[i].name;
                        }
                }
        }

        if(nameString.length){
                //TODO add the option to hold populations steady.
                const title = "Insufficient Population Data";
                let msg = "The specified simulation duration is longer than the amount of population data supplied. Population(s) <i>";
                msg += nameString + "</i> have less than <b>" + simData.years + "</b> years worth of data. </br></br>Please adjust the simulation duration or provide additional data.";
                modalDialog(title, msg);
                return false;
        }
        else{
                return true;
        }
}

function sanitizeTownData(uiTown){
        let data = jQuery.extend(true, {}, uiTown);
        data.offtake = [];
        data.long = parseFloat(data.long);
        data.lat = parseFloat(data.lat);

        if(data.type === 'exp'){
                data.population = parseInt(data.population);
                data.growthRate = parseFloat(data.growthRate);
        }

        if(data.killRate && !isNaN(parseFloat(data.killRate))){
                data.killRate = parseFloat(data.killRate);
        }
        else{
                data.killRate = simData.killProb;
        }

        return data;
}

function setupWorker(){
        workerThread = new Worker('jsDev/model.js');
        workerThread.onmessage = function(oEvent) {
                handleWorkerMessage(oEvent.data);
        };
}

function setupSimulation(){
        if(!checkSettings())
                return;

        console.log("----------------Starting sim setup-------------------");
        //maybe move this to output display setup
        var cleanup = document.getElementById("rawHeatmapContainer");
        while (cleanup.firstChild) {
                cleanup.removeChild(cleanup.firstChild);
        }
        
        setupSimDefaults();
        readUserParameters();
        const debugMode = document.getElementById("debugModeToggle").checked;

        let townData = setupTowns();
        if(!townData)
                return;
        
        geoGridFeatures.clear(true);
        debugSource.clear(true);

        showProgressBar("Setting up simulation", 0);
        workerThread.postMessage({type:"newSim", params:simData, towns:townData, debug:debugMode});
}

function mapWorkerFunctions(){
        workerFunctions = {
                'progress': function(data) {updateProgressBar(data.statusMsg, data.statusValue);},
                'updateCDFChart': function(data) {createCDFChart(data.densities);},
                'extentDebug': function(data) {drawDebugBounds(data.data.points, data.data.color);},
                'circleDebug': function(data) {drawDebugCircle(data.data.points, data.data.color);},
                'pointDebug': function(data) {drawDebugPoint(data.data.point, data.data.color);},
                'singleCSV': function(data) {saveSingleCSV(data.csvString, data.year);},
                'allYearsCSV': function(data) {saveAllYearsCSV(data.csvString, data.year);},
        };
}

function handleWorkerMessage(data){
        switch(data.type){
        case 'mapped':
                workerFunctions[data.fnc](data);
                break;
        case 'finished': {
                simResults = data.paramData;
                updateProgressBar("Visualizing Data", 100);
                workerThread.postMessage({type:'genImage', dest:'mapViewer', year:simData.years, scale:2});
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                workerThread.postMessage({type:'getCDFData', year:simData.years});
                //workerThread.postMessage({type:'getLocalCDFData', year:simData.years});
                closeProgressBar();
                break;
                }
        case 'debug':
                console.log("Worker::" + data.statusMsg);
                break;
        case 'error':
                let title = "An Error Occured";
                let msg = "An error prevented the simulation from running. Please verify parameters and populations and try again. </br>";
                msg += "If you would like to report this error: return to the Get Started page -> Quicksave -> Download that config -> email it to the developer.";
                modalDialog(title, msg, changeToPopulations);
                break;
        case 'imgData': {
                console.log("handleWorkerMessage: array[10]: " + data.array[10] + " size: " + data.array.length);
                generateCanvas(data.year, data.scale, data.array, data.dest, data.position);
                break;
                }
        }
}
